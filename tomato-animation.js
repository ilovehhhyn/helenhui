(function () {
    "use strict";

    var tomato = document.querySelector(".tomato-animation");
    var tomatoArt = tomato && tomato.querySelector(".tomato-art");
    var target = document.getElementById("tomato-tree-target");

    if (!tomato || !tomatoArt || !target) {
        return;
    }

    function easeCos(from, to, progress) {
        return from + (to - from) * (1 - Math.cos(Math.PI * progress)) / 2;
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

        // land with the center of mass right over the corner of "tree":
        // an unstable equilibrium, so the wobble that follows can grow
        var landingX = targetRect.right - tomatoWidth * 0.5;
        var landingY = targetRect.top - tomatoHeight + 4;
        var startY = -tomatoHeight - 20;
        var exitY = window.innerHeight + tomatoHeight + 30;
        var baseTilt = -2;

        // one gravity for every airborne phase
        var gravity = 2200;
        var delay = 0.25;

        // fall: free fall from rest, y = 1/2 g t^2, stretching with speed
        var dropHeight = landingY - startY;
        var dropDuration = Math.sqrt(2 * dropHeight / gravity);
        var impactVelocity = gravity * dropDuration;
        var dropStretchMax = 0.06;

        // bounce: coefficient of restitution scales the rebound velocity,
        // so bounce height = e^2 * drop height under the same gravity
        var restitution = 0.42;
        var bounceVelocity = restitution * impactVelocity;
        var bounceDuration = 2 * bounceVelocity / gravity;
        var bounceStretchMax = 0.05;

        var squashDuration = 0.09;
        var squash2Duration = 0.07;

        // wobble: perturbation on an unstable pivot grows, so both the
        // amplitude and the rocking frequency rise until it tips over.
        // phase is a chirp ending exactly at a peak (3.25 cycles) so the
        // tip-over continues from the wobble's final angle
        var wobbleDuration = 1.2;
        var wobblePhaseTotal = 2 * Math.PI * 3.25;
        var wobbleChirpPower = 1.8;
        var wobbleAmplitudeEnd = 20;
        var wobbleLean = 0.3; // px of x shift per degree of rocking

        // tip-over: gravity torque about the corner ramps the spin and
        // horizontal speed up from zero; once contact is lost there is no
        // torque about the center, so both rates stay constant
        var pivotDuration = 0.22;
        var fallSpin = 100;  // deg/s after leaving the corner
        var fallDrift = 90;  // px/s of horizontal speed after tipping
        var fallDuration = Math.sqrt(2 * (exitY - landingY) / gravity);

        var dropEnd = dropDuration;
        var squashEnd = dropEnd + squashDuration;
        var bounceEnd = squashEnd + bounceDuration;
        var squash2End = bounceEnd + squash2Duration;
        var wobbleEnd = squash2End + wobbleDuration;
        var animationEnd = wobbleEnd + fallDuration;

        var tipAngle = baseTilt + wobbleAmplitudeEnd;
        var tipX = landingX + wobbleAmplitudeEnd * wobbleLean;
        var startedAt = null;

        function squashScales(progress, entryStretch, squashAmount) {
            // dip from the incoming stretch into the squash, then recover;
            // cosine-eased so both ends join their neighbors smoothly
            var scaleY;
            if (progress < 0.35) {
                scaleY = easeCos(1 + entryStretch, 1 - squashAmount, progress / 0.35);
            } else {
                scaleY = easeCos(1 - squashAmount, 1, (progress - 0.35) / 0.65);
            }
            return { y: scaleY, x: 1 - (scaleY - 1) * 0.8 };
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
            var rotation = baseTilt;
            var scaleX = 1;
            var scaleY = 1;
            var scales;

            if (elapsed >= 0 && elapsed < dropEnd) {
                y = startY + 0.5 * gravity * elapsed * elapsed;
                // stretch along the velocity as it picks up speed
                var dropStretch = dropStretchMax * (elapsed / dropDuration);
                scaleY = 1 + dropStretch;
                scaleX = 1 - dropStretch * 0.8;
            } else if (elapsed >= dropEnd && elapsed < squashEnd) {
                y = landingY;
                scales = squashScales((elapsed - dropEnd) / squashDuration,
                    dropStretchMax, 0.2);
                scaleY = scales.y;
                scaleX = scales.x;
            } else if (elapsed >= squashEnd && elapsed < bounceEnd) {
                var bounceTime = elapsed - squashEnd;
                var bounceSpeed = bounceVelocity - gravity * bounceTime;
                y = landingY - (bounceVelocity * bounceTime - 0.5 * gravity * bounceTime * bounceTime);
                // stretch follows the speed: zero at the apex, and eased in
                // over the first moments so it joins the squash recovery
                var bounceStretch = bounceStretchMax * Math.abs(bounceSpeed) / bounceVelocity;
                bounceStretch *= Math.min(1, bounceTime / 0.06);
                scaleY = 1 + bounceStretch;
                scaleX = 1 - bounceStretch * 0.8;
            } else if (elapsed >= bounceEnd && elapsed < squash2End) {
                y = landingY;
                scales = squashScales((elapsed - bounceEnd) / squash2Duration,
                    bounceStretchMax, 0.11);
                scaleY = scales.y;
                scaleX = scales.x;
            } else if (elapsed >= squash2End && elapsed < wobbleEnd) {
                var wobbleProgress = (elapsed - squash2End) / wobbleDuration;
                // frequency rises with the chirp, amplitude grows toward
                // the tipping angle; both start at zero, so the wobble
                // emerges seamlessly from stillness
                var wobblePhase = wobblePhaseTotal * Math.pow(wobbleProgress, wobbleChirpPower);
                var wobbleAngle = wobbleAmplitudeEnd * Math.pow(wobbleProgress, 1.5) *
                    Math.sin(wobblePhase);
                x = landingX + wobbleAngle * wobbleLean;
                y = landingY;
                rotation = baseTilt + wobbleAngle;
            } else if (elapsed >= wobbleEnd) {
                var fallTime = Math.min(elapsed - wobbleEnd, fallDuration);
                var spin;
                var drift;
                if (fallTime < pivotDuration) {
                    // constant angular acceleration about the corner
                    var pivotAccel = fallSpin / pivotDuration;
                    var driftAccel = fallDrift / pivotDuration;
                    spin = 0.5 * pivotAccel * fallTime * fallTime;
                    drift = 0.5 * driftAccel * fallTime * fallTime;
                } else {
                    var freeTime = fallTime - pivotDuration;
                    spin = 0.5 * fallSpin * pivotDuration + fallSpin * freeTime;
                    drift = 0.5 * fallDrift * pivotDuration + fallDrift * freeTime;
                }
                x = tipX + drift;
                y = landingY + 0.5 * gravity * fallTime * fallTime;
                rotation = tipAngle + spin;
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
