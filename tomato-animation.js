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
        var fullRollOffX = targetRect.right + tomatoWidth * 0.35;
        var rollDistance = (fullRollOffX - landingX) * (2 / 3) + 3;
        var rollOffX = landingX + rollDistance;
        var startY = -tomatoHeight - 20;
        var exitY = window.innerHeight + tomatoHeight + 30;

        var gravity = 900;
        var bounceGravity = 19800;
        var bounceHeight = 5;
        var delay = 0.18;
        var compressionDuration = 0.025;
        var settleDuration = 0.04 / 3;
        var wobbleDuration = 1;
        var wobbleAmplitude = 7;
        var wobbleCycles = 2;
        var rollDuration = 1 / 3;
        var dropDuration = Math.sqrt((2 * (landingY - startY)) / gravity);
        var bounceVelocity = Math.sqrt(2 * bounceGravity * bounceHeight);
        var bounceDuration = (2 * bounceVelocity) / bounceGravity;
        var edgeFallDuration = Math.sqrt((2 * (exitY - landingY)) / gravity);
        var targetRolls = 2;
        var rollRadians = targetRolls * 2 * Math.PI;
        var rollingRadius = rollDistance / rollRadians;
        var tomatoMass = 1;
        var inertiaCoefficient = 0.5;
        var rotationalInertia = inertiaCoefficient * tomatoMass * rollingRadius * rollingRadius;
        var driveTorque = rotationalInertia * (2 * rollRadians / (rollDuration * rollDuration));
        var angularAcceleration = driveTorque / rotationalInertia;
        var linearAcceleration = angularAcceleration * rollingRadius;
        var edgeAngularVelocity = angularAcceleration * rollDuration;
        var angularAirDrag = 0.35;
        var dropEnd = dropDuration;
        var compressionEnd = dropEnd + compressionDuration;
        var bounceEnd = compressionEnd + bounceDuration;
        var settleEnd = bounceEnd + settleDuration;
        var wobbleEnd = settleEnd + wobbleDuration;
        var rollEnd = wobbleEnd + rollDuration;
        var animationEnd = rollEnd + edgeFallDuration;
        var startedAt = null;

        function degreesFromRadians(radians) {
            return -2 + radians * (180 / Math.PI);
        }

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
            var rotation = -2;
            var scaleX = 1;
            var scaleY = 1;

            if (elapsed >= 0 && elapsed < dropEnd) {
                y = startY + 0.5 * gravity * elapsed * elapsed;
            } else if (elapsed >= dropEnd && elapsed < compressionEnd) {
                var compressionProgress = (elapsed - dropEnd) / compressionDuration;
                var compressionPulse = Math.sin(Math.PI * compressionProgress);
                y = landingY;
                scaleX = 1 + 0.055 * compressionPulse;
                scaleY = 1 - 0.075 * compressionPulse;
            } else if (elapsed >= compressionEnd && elapsed < bounceEnd) {
                var bounceTime = elapsed - compressionEnd;
                y = landingY - (bounceVelocity * bounceTime - 0.5 * bounceGravity * bounceTime * bounceTime);
            } else if (elapsed >= bounceEnd && elapsed < settleEnd) {
                y = landingY;
            } else if (elapsed >= settleEnd && elapsed < wobbleEnd) {
                var wobbleProgress = (elapsed - settleEnd) / wobbleDuration;
                var wobbleDecay = 1 - wobbleProgress;
                y = landingY;
                rotation = -2 + wobbleAmplitude *
                    Math.sin(wobbleCycles * 2 * Math.PI * wobbleProgress) * wobbleDecay;
            } else if (elapsed >= wobbleEnd && elapsed < rollEnd) {
                var rollTime = elapsed - wobbleEnd;
                var traveled = 0.5 * linearAcceleration * rollTime * rollTime;
                x = landingX + traveled;
                y = landingY;
                rotation = degreesFromRadians(0.5 * angularAcceleration * rollTime * rollTime);
            } else if (elapsed >= rollEnd) {
                var edgeTime = Math.min(elapsed - rollEnd, edgeFallDuration);
                var fallingRotation = edgeAngularVelocity *
                    (1 - Math.exp(-angularAirDrag * edgeTime)) / angularAirDrag;
                x = rollOffX;
                y = landingY + 0.5 * gravity * edgeTime * edgeTime;
                rotation = degreesFromRadians(rollRadians + fallingRotation);
            }

            renderTomato(x, y, rotation, scaleX, scaleY);

            if (elapsed < animationEnd) {
                window.requestAnimationFrame(animateFrame);
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
