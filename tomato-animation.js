(function () {
    "use strict";

    var tomato = document.querySelector(".tomato-animation");
    var tomatoArt = tomato && tomato.querySelector(".tomato-art");
    var target = document.getElementById("tomato-tree-target");

    if (!tomato || !tomatoArt || !target) {
        return;
    }

    function runTomatoAnimation() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        var tomatoRect = tomato.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var tomatoWidth = tomatoRect.width;
        var tomatoHeight = tomatoRect.height;

        if (targetRect.bottom < 0 || targetRect.top > window.innerHeight) {
            return;
        }

        var landingX = targetRect.left + (targetRect.width - tomatoWidth) / 2;
        var landingY = targetRect.top - tomatoHeight + 4;
        // roll ends with the tomato's center right at the text's edge, teetering
        var rollEndX = targetRect.right - tomatoWidth * 0.5;
        var rollDistance = rollEndX - landingX;
        var startY = -tomatoHeight - 20;
        var exitY = window.innerHeight + tomatoHeight + 30;
        var baseTilt = -2;

        // one gravity for every airborne phase
        var gravity = 2200;
        var delay = 0.25;

        // fall: free fall from rest, y = 1/2 g t^2
        var dropHeight = landingY - startY;
        var dropDuration = Math.sqrt(2 * dropHeight / gravity);
        var impactVelocity = gravity * dropDuration;

        // bounce: coefficient of restitution scales the rebound velocity,
        // so bounce height = e^2 * drop height under the same gravity
        var restitution = 0.42;
        var bounceVelocity = restitution * impactVelocity;
        var bounceDuration = 2 * bounceVelocity / gravity;

        var squashDuration = 0.09;
        var squash2Duration = 0.07;
        var settlePause = 0.15;

        // roll: rolling without slipping, rotation = distance / radius.
        // radius chosen so the roll distance is exactly two revolutions
        var targetRolls = 2;
        var rollRadius = rollDistance / (targetRolls * 2 * Math.PI);
        var rollDuration = 1.15;
        // accelerate half the time, decelerate half, at rest at the edge
        var rollAcceleration = 4 * rollDistance / (rollDuration * rollDuration);
        var rollDegreesTotal = targetRolls * 360;

        // wobble: damped rocking at the edge, 3 cycles in 1 second
        var wobbleDuration = 1.0;
        var wobbleCycles = 3;
        var wobbleAmplitude = 13;
        var wobbleDamping = 0.55;

        // fall off: free fall from rest; angular momentum is conserved in
        // free fall, so it keeps a small constant spin
        var fallSpin = 40;
        var fallDuration = Math.sqrt(2 * (exitY - landingY) / gravity);

        var dropEnd = dropDuration;
        var squashEnd = dropEnd + squashDuration;
        var bounceEnd = squashEnd + bounceDuration;
        var squash2End = bounceEnd + squash2Duration;
        var settleEnd = squash2End + settlePause;
        var rollEnd = settleEnd + rollDuration;
        var wobbleEnd = rollEnd + wobbleDuration;
        var animationEnd = wobbleEnd + fallDuration;
        var restRotation = baseTilt + rollDegreesTotal;
        var startedAt = null;

        function renderTomato(x, y, rotation, scaleX, scaleY) {
            tomato.style.opacity = "1";
            tomato.style.transform = "translate(" + x + "px, " + y + "px)";
            tomatoArt.style.transform = "rotate(" + rotation + "deg) " +
                "scale(" + scaleX + ", " + scaleY + ")";
        }

        function animateFrame(timestamp) {
            if (startedAt === null) {
                startedAt = timestamp;
            }

            var elapsed = (timestamp - startedAt) / 1000 - delay;
            var x = landingX;
            var y = startY;
            var rotation = baseTilt;
            var scaleX = 1;
            var scaleY = 1;

            if (elapsed >= 0 && elapsed < dropEnd) {
                y = startY + 0.5 * gravity * elapsed * elapsed;
                // stretch along the velocity as it picks up speed
                var dropStretch = 0.06 * (elapsed / dropDuration);
                scaleY = 1 + dropStretch;
                scaleX = 1 - dropStretch * 0.6;
            } else if (elapsed >= dropEnd && elapsed < squashEnd) {
                var squashPulse = Math.sin(Math.PI * (elapsed - dropEnd) / squashDuration);
                y = landingY;
                scaleX = 1 + 0.16 * squashPulse;
                scaleY = 1 - 0.2 * squashPulse;
            } else if (elapsed >= squashEnd && elapsed < bounceEnd) {
                var bounceTime = elapsed - squashEnd;
                var bounceSpeed = bounceVelocity - gravity * bounceTime;
                y = landingY - (bounceVelocity * bounceTime - 0.5 * gravity * bounceTime * bounceTime);
                // stretch fades to nothing at the apex where speed is zero
                var bounceStretch = 0.05 * Math.abs(bounceSpeed) / bounceVelocity;
                scaleY = 1 + bounceStretch;
                scaleX = 1 - bounceStretch * 0.6;
            } else if (elapsed >= bounceEnd && elapsed < squash2End) {
                var squash2Pulse = Math.sin(Math.PI * (elapsed - bounceEnd) / squash2Duration);
                y = landingY;
                scaleX = 1 + 0.09 * squash2Pulse;
                scaleY = 1 - 0.11 * squash2Pulse;
            } else if (elapsed >= squash2End && elapsed < settleEnd) {
                y = landingY;
            } else if (elapsed >= settleEnd && elapsed < rollEnd) {
                var rollTime = elapsed - settleEnd;
                var halfRoll = rollDuration / 2;
                var traveled;
                if (rollTime < halfRoll) {
                    traveled = 0.5 * rollAcceleration * rollTime * rollTime;
                } else {
                    var remaining = rollDuration - rollTime;
                    traveled = rollDistance - 0.5 * rollAcceleration * remaining * remaining;
                }
                x = landingX + traveled;
                y = landingY;
                rotation = baseTilt + (traveled / rollRadius) * (180 / Math.PI);
            } else if (elapsed >= rollEnd && elapsed < wobbleEnd) {
                var wobbleProgress = (elapsed - rollEnd) / wobbleDuration;
                var wobbleAngle = wobbleAmplitude *
                    Math.sin(wobbleCycles * 2 * Math.PI * wobbleProgress) *
                    (1 - wobbleDamping * wobbleProgress);
                x = rollEndX + wobbleAngle * 0.3;
                y = landingY;
                rotation = restRotation + wobbleAngle;
            } else if (elapsed >= wobbleEnd) {
                var fallTime = Math.min(elapsed - wobbleEnd, fallDuration);
                x = rollEndX;
                y = landingY + 0.5 * gravity * fallTime * fallTime;
                rotation = restRotation + fallSpin * fallTime;
            }

            renderTomato(x, y, rotation, scaleX, scaleY);

            if (elapsed < animationEnd) {
                window.requestAnimationFrame(animateFrame);
            } else {
                tomato.style.opacity = "0";
            }
        }

        window.requestAnimationFrame(animateFrame);
    }

    if (document.readyState === "complete") {
        window.requestAnimationFrame(runTomatoAnimation);
    } else {
        window.addEventListener("load", function () {
            window.requestAnimationFrame(runTomatoAnimation);
        }, { once: true });
    }
}());
