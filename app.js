document.addEventListener("DOMContentLoaded", () => {
    const startDate = new Date('2026-06-02T16:42:00+05:30');
    let driftOffset = 0;

    // Fetch internet time with a 2s timeout fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { signal: controller.signal })
        .then(res => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error("API not ok");
            return res.json();
        })
        .then(data => {
            const trueInternetTime = new Date(data.utc_datetime).getTime();
            driftOffset = trueInternetTime - Date.now();
        })
        .catch(err => {
            clearTimeout(timeoutId);
            console.warn("Internet time fetch failed, falling back to local time");
        });

    const getAccurateNow = () => Date.now() + driftOffset;

    const getTargets = () => {
        const elapsed = getAccurateNow() - startDate.getTime();
        return {
            days: Math.max(0, Math.floor(elapsed / (1000 * 60 * 60 * 24))),
            hours: Math.max(0, Math.floor(elapsed / (1000 * 60 * 60))),
            minutes: Math.max(0, Math.floor(elapsed / (1000 * 60))),
            seconds: Math.max(0, Math.floor(elapsed / 1000))
        };
    };

    let liveRestInterval = null;
    function stopLiveRest() {
        if (liveRestInterval) {
            clearInterval(liveRestInterval);
            liveRestInterval = null;
        }
    }


    // --- FULLSCREEN LOGIC & START EXPERIENCE ---
    let experienceStarted = false;
    const preStartOverlay = document.getElementById('pre-start-overlay');
    const startFullscreenBtn = document.getElementById('start-fullscreen-btn');

    if (startFullscreenBtn) {
        startFullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(e => console.warn(e));
                    }
                    startExperience();
                }).catch(err => {
                    console.warn(`Fullscreen error: ${err.message}`);
                    startExperience(); // Start anyway if fullscreen blocked
                });
            } else {
                startExperience();
            }
        });
    }

    const fsBtn = document.getElementById('fs-btn');
    if (fsBtn) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Fullscreen error: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            if (fsBtn) fsBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
        } else {
            if (fsBtn) fsBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
        }
    });

    function startExperience() {
        if (experienceStarted) return;
        experienceStarted = true;
        document.body.classList.add('experience-running');

        if (preStartOverlay) {
            preStartOverlay.style.opacity = '0';
            preStartOverlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => preStartOverlay.style.display = 'none', 500);
        }

        const textElement = document.getElementById('center-text');

        // Text hides by slicing upwards
        setTimeout(() => {
            if (textElement) {
                textElement.style.animation = "hardHideUp 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards";
            }
        }, 6000);

        // Animate numbers and slide them together
        setTimeout(() => {
            const scene = document.querySelector('.scene-container');
            const textWrap = document.getElementById('text-wrap');

            if (textWrap) {
                // Freeze current width before shrinking to avoid sudden jumps
                textWrap.style.width = textWrap.offsetWidth + 'px';

                // Force a browser reflow so the style is applied immediately
                void textWrap.offsetWidth;

                textWrap.style.width = '0px';
            }

            if (scene) {
                // Trigger the convergence layout
                scene.classList.add('converge');
            }

            // Dynamically calculate the duration (spin speed) based on how many numbers it has to count through.
            // This ensures the counting speed feels consistent and scales dynamically whether it counts to 16 or 100.
            const leftStart = 2;
            const leftEnd = 16;
            // Base speed of 120ms per digit, but ensure it takes at least 1500ms
            const dynamicLeftDuration = Math.max(1500, (leftEnd - leftStart) * 120);

            // Left number: Target updated to 16 with dynamically calculated speed
            if (document.getElementById("num-left")) animateValue("num-left", leftStart, leftEnd, dynamicLeftDuration);

            // Right number: longer duration so it finishes slightly late
            if (document.getElementById("num-right")) animateValue("num-right", 6, 42, 2200);
        }, 6500);

        // Phase 3: Slide out subtitle and change numbers down to 6:8 without leading zeros
        setTimeout(() => {
            const subtitle = document.querySelector('.subtitle-text');
            if (subtitle) {
                // Apply the exact same slice-up hide animation used earlier
                subtitle.style.animation = "hardHideUp 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards";
            }

            // Wait for the subtitle to slide away before starting the final number countdown
            setTimeout(() => {
                const scene = document.querySelector('.scene-container');
                if (scene) {
                    // Fade out the colon quickly in place
                    scene.classList.add('fade-colon');
                }

                // Calculate dynamic days split for the slide effect
                const targets = getTargets();
                const targetDaysStr = targets.days.toString();
                let targetLeftDays, targetRightDays;
                if (targetDaysStr.length >= 2) {
                    targetLeftDays = parseInt(targetDaysStr.slice(0, targetDaysStr.length - 1));
                    targetRightDays = parseInt(targetDaysStr.slice(-1));
                } else {
                    targetLeftDays = 0;
                    targetRightDays = parseInt(targetDaysStr);
                }

                // Left number counts down 16 -> target left
                const leftStart2 = 16;
                const leftEnd2 = targetLeftDays;
                const dynamicLeftDuration2 = Math.max(1500, Math.abs(leftEnd2 - leftStart2) * 120);

                // Right number counts down 42 -> target right
                const rightStart2 = 42;
                const rightEnd2 = targetRightDays;
                const dynamicRightDuration2 = Math.max(1500, Math.abs(rightEnd2 - rightStart2) * 120);

                // Trigger the countdown and pass 'false' to drop the leading zeros
                const p1 = document.getElementById("num-left") ? animateValue("num-left", leftStart2, leftEnd2, dynamicLeftDuration2, false) : Promise.resolve();
                const p2 = document.getElementById("num-right") ? animateValue("num-right", rightStart2, rightEnd2, dynamicRightDuration2, false) : Promise.resolve();

                Promise.all([p1, p2]).then(() => {
                    liveRestInterval = setInterval(() => {
                        const liveTargets = getTargets();
                        const targetDaysStr = liveTargets.days.toString();
                        let targetLeftDays = 0, targetRightDays = 0;
                        if (targetDaysStr.length >= 2) {
                            targetLeftDays = parseInt(targetDaysStr.slice(0, targetDaysStr.length - 1));
                            targetRightDays = parseInt(targetDaysStr.slice(-1));
                        } else {
                            targetRightDays = parseInt(targetDaysStr);
                        }
                        const nl = document.getElementById('num-left');
                        const nr = document.getElementById('num-right');
                        if (nl) nl.innerText = targetLeftDays.toString();
                        if (nr) nr.innerText = targetRightDays.toString();
                    }, 1000);
                });

                // Trigger merge immediately. The CSS speed curve now handles the "delay" organically.
                if (scene) {
                    scene.classList.add('merge');
                }

                // Fade in "days" exactly as the number settles on 68
                const daysText = document.getElementById('days-text');
                if (daysText) {
                    // The soft fade takes 1.5s (1500ms). We trigger it exactly 1500ms before 
                    // the right number finishes counting, ensuring they complete simultaneously.
                    const fadeDuration = 1500;
                    const syncDelay = dynamicRightDuration2 - fadeDuration;

                    setTimeout(() => {
                        daysText.style.animation = `softFadeUp ${fadeDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`;
                    }, syncDelay);
                }

                // Phase 3: Start gradient spawn
                const b1 = document.getElementById('ball-1');
                if (b1) b1.style.opacity = '0.6';

            }, 1000); // 1-second delay lets the subtitle clear out first

        }, 11500); // Reduced delay to 11.5 seconds so it feels much tighter

        // Phase 4: Shift from days to hours
        setTimeout(() => {
            const b2 = document.getElementById('ball-2');
            if (b2) b2.style.opacity = '0.6';
            const numLeft = document.getElementById('num-left');
            const numRight = document.getElementById('num-right');
            const targets = getTargets();

            if (numLeft && numRight) {
                numLeft.style.width = 'auto';
                numLeft.style.textAlign = 'center';
                numLeft.innerText = targets.days.toLocaleString();
                numRight.style.display = 'none';
            }

            stopLiveRest();
            const spinDuration3 = 3240; // 3.24s spin
            if (numLeft) {
                animateValue("num-left", targets.days, targets.hours, spinDuration3, false).then(() => {
                    liveRestInterval = setInterval(() => {
                        const liveTargets = getTargets();
                        const nl = document.getElementById('num-left');
                        if (nl) nl.innerText = liveTargets.hours.toLocaleString();
                    }, 1000);
                });
            }

            // Odometer style roll for the text
            const daysText = document.getElementById('days-text');
            const hoursText = document.getElementById('hours-text');

            if (daysText && hoursText) {
                const textDuration = spinDuration3 + 300;
                daysText.style.animation = `rollUpOut ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
                hoursText.style.animation = `rollUpIn ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
            }
        }, 18500); // Triggers ~2.0 seconds after days fully arrives

        // Phase 5: Shift from hours to minutes
        setTimeout(() => {
            const b3 = document.getElementById('ball-3');
            if (b3) b3.style.opacity = '0.6';
            const numLeft = document.getElementById('num-left');
            const targets = getTargets();

            const startNum = targets.hours;
            const endNum = targets.minutes;
            const spinDuration = 3800; // fixed 3.8s for this massive spin

            stopLiveRest();
            // Predict the exact minutes value to prevent skip if a minute ticks over
            const predictedEndNum = targets.minutes + Math.floor(spinDuration / 60000);

            // Trigger the unified countdown
            if (numLeft) {
                animateValue("num-left", startNum, predictedEndNum, spinDuration, false).then(() => {
                    liveRestInterval = setInterval(() => {
                        const liveTargets = getTargets();
                        const nl = document.getElementById('num-left');
                        if (nl) nl.innerText = liveTargets.minutes.toLocaleString();
                    }, 1000);
                });
            }

            // Odometer style roll for the text
            const hoursText = document.getElementById('hours-text');
            const minutesText = document.getElementById('minutes-text');

            if (hoursText && minutesText) {
                const textDuration = spinDuration + 300;
                hoursText.style.animation = `rollUpOut ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
                minutesText.style.animation = `rollUpIn ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
            }
        }, 23940); // Triggers ~2.2 seconds after hours finishes its ~3.2s spin

        // Phase 6: Shift from minutes to seconds
        setTimeout(() => {
            const b4 = document.getElementById('ball-4');
            if (b4) b4.style.opacity = '0.6';
            const numLeft = document.getElementById('num-left');
            const targets = getTargets();

            const startNum = targets.minutes;
            const spinDuration = 4500; // 4.5s for this massive spin

            // Predict the exact seconds value when the spin finishes to prevent a visual skip
            const predictedEndNum = targets.seconds + Math.round(spinDuration / 1000);

            stopLiveRest();
            // Trigger the unified countdown
            if (numLeft) {
                animateValue("num-left", startNum, predictedEndNum, spinDuration, false).then(() => {
                    // After it lands on the final predicted number, start ticking live immediately
                    const liveTargets = getTargets();
                    const nl = document.getElementById('num-left');
                    if (nl) nl.innerText = liveTargets.seconds.toLocaleString();

                    liveRestInterval = setInterval(() => {
                        const currentLiveTargets = getTargets();
                        if (nl) nl.innerText = currentLiveTargets.seconds.toLocaleString();
                    }, 1000);
                });
            }

            // Odometer style roll for the text
            const minutesText = document.getElementById('minutes-text');
            const secondsText = document.getElementById('seconds-text');

            if (minutesText && secondsText) {
                const textDuration = spinDuration + 300;
                minutesText.style.animation = `rollUpOut ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
                secondsText.style.animation = `rollUpIn ${textDuration}ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
            }
        }, 30140); // Triggers ~2.4 seconds after Phase 5 finishes

        // Phase 7: Roll down to 0 and fade out "seconds" text
        setTimeout(() => {
            const b5 = document.getElementById('ball-5');
            if (b5) b5.style.opacity = '0.6';
            stopLiveRest();
            const numLeft = document.getElementById('num-left');
            const secondsText = document.getElementById('seconds-text');

            if (numLeft) {
                // Extract current number dynamically to spin down from exactly where it is
                const currentNum = parseInt(numLeft.innerText.replace(/,/g, ''), 10) || 0;
                animateValue("num-left", currentNum, 0, 4000, false);

                // Fade out the number while it is rolling
                numLeft.style.animation = `rollUpOut 4000ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
            }

            if (secondsText) {
                // Lock the final state of the previous animation
                secondsText.style.opacity = '1';
                secondsText.style.transform = 'translateY(0)';

                // Clear the CSS animation so it stops overriding inline styles
                secondsText.style.animation = 'none';

                // Fade out the text immediately as the number starts spinning
                secondsText.style.animation = `rollUpOut 2000ms cubic-bezier(0.5, 0, 0.2, 1) forwards`;
            }
        }, 38640); // 30140 (Phase 6) + 4500 (spin) + 4000 (rest)

        // Phase 8: Final Reveal (Re-applied successfully)
        setTimeout(() => {
            const finalText = document.getElementById('final-text');
            if (finalText) {
                const getExactBreakdown = (offsetMs = 0) => {
                    const elapsed = getAccurateNow() + offsetMs - startDate.getTime();
                    const totalSeconds = Math.max(0, Math.floor(elapsed / 1000));
                    return {
                        days: Math.floor(totalSeconds / (3600 * 24)),
                        hours: Math.floor((totalSeconds % (3600 * 24)) / 3600),
                        minutes: Math.floor((totalSeconds % 3600) / 60),
                        seconds: totalSeconds % 60
                    };
                };

                // Slide in with the initialized 00s
                finalText.style.animation = `hardReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;

                // Wait for the slide-in to complete, then roll the numbers
                setTimeout(() => {
                    // Predict the exact time 2000ms from now when the spinning stops
                    const t = getExactBreakdown(2000);

                    Promise.all([
                        animateValue("final-days", 0, t.days, 2000, true),
                        animateValue("final-hours", 0, t.hours, 2000, true),
                        animateValue("final-minutes", 0, t.minutes, 2000, true),
                        animateValue("final-seconds", 0, t.seconds, 2000, true)
                    ]).then(() => {
                        // First, manually update to the current exact time immediately to prevent any flicker
                        const live = getExactBreakdown();
                        document.getElementById('final-days').innerText = String(live.days).padStart(2, '0');
                        document.getElementById('final-hours').innerText = String(live.hours).padStart(2, '0');
                        document.getElementById('final-minutes').innerText = String(live.minutes).padStart(2, '0');
                        document.getElementById('final-seconds').innerText = String(live.seconds).padStart(2, '0');

                        // Hand off to the live interval
                        liveRestInterval = setInterval(() => {
                            const currentLive = getExactBreakdown();
                            document.getElementById('final-days').innerText = String(currentLive.days).padStart(2, '0');
                            document.getElementById('final-hours').innerText = String(currentLive.hours).padStart(2, '0');
                            document.getElementById('final-minutes').innerText = String(currentLive.minutes).padStart(2, '0');
                            document.getElementById('final-seconds').innerText = String(currentLive.seconds).padStart(2, '0');
                        }, 1000);

                        // Reveal the "The story continues" text exactly as the final text lands
                        const finalSubtitle = document.getElementById('final-subtitle');
                        if (finalSubtitle) {
                            finalSubtitle.style.animation = `hardReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;

                            // Keep the final timer on screen for 5s, then fade to completely dark
                            setTimeout(() => {
                                const fadeOverlay = document.createElement('div');
                                fadeOverlay.style.position = 'fixed';
                                fadeOverlay.style.top = '0';
                                fadeOverlay.style.left = '0';
                                fadeOverlay.style.width = '100vw';
                                fadeOverlay.style.height = '100vh';
                                fadeOverlay.style.backgroundColor = 'black';
                                fadeOverlay.style.zIndex = '9999';
                                fadeOverlay.style.opacity = '0';
                                fadeOverlay.style.pointerEvents = 'none';
                                fadeOverlay.style.transition = 'opacity 4s ease-in-out';
                                document.body.appendChild(fadeOverlay);

                                // Trigger reflow to ensure the transition happens
                                void fadeOverlay.offsetWidth;
                                fadeOverlay.style.opacity = '1';

                                // Trigger the fireworks and "HAPPY BIRTHDAY RUBY" animation after the screen is dark
                                setTimeout(() => {
                                    // Inject fireworks iframe
                                    const fwIframe = document.createElement('iframe');
                                    fwIframe.src = 'Firework/index.html';
                                    fwIframe.style.position = 'fixed';
                                    fwIframe.style.top = '0';
                                    fwIframe.style.left = '0';
                                    fwIframe.style.width = '100vw';
                                    fwIframe.style.height = '100vh';
                                    fwIframe.style.border = 'none';
                                    fwIframe.style.zIndex = '10000';
                                    fwIframe.style.opacity = '0';
                                    fwIframe.style.pointerEvents = 'none'; // Super optimize: disable interactions so they don't block
                                    fwIframe.style.transition = 'opacity 2s ease-in-out';
                                    fwIframe.setAttribute('allow', 'autoplay'); // Allow sound to play
                                    
                                    fwIframe.onload = () => {
                                        // Unpause and enable sound in the fireworks iframe
                                        fwIframe.contentWindow.postMessage({ type: 'enable-sound' }, '*');
                                    };
                                    
                                    document.body.appendChild(fwIframe);

                                    // Fade in fireworks
                                    setTimeout(() => fwIframe.style.opacity = '1', 100);

                                    const bdayText = document.createElement('div');
                                    bdayText.innerText = 'HAPPY BIRTHDAY RUBY';
                                    bdayText.className = 'birthday-text';
                                    bdayText.style.zIndex = '10001'; // Ensure text is above fireworks
                                    document.body.appendChild(bdayText);
                                    
                                    // Start the 10-second animation
                                    bdayText.style.animation = 'beautifulGlow 10s ease-in-out forwards';
                                    
                                    // Show the personal message after the birthday text fades out
                                    setTimeout(() => {
                                        // Turn off firework sound when the message appears
                                        if (fwIframe && fwIframe.contentWindow) {
                                            fwIframe.contentWindow.postMessage({ type: 'disable-sound' }, '*');
                                        }

                                        const messageContainer = document.createElement('div');
                                        messageContainer.className = 'personal-message-container';
                                        messageContainer.innerHTML = `
                                            <p>hiii rabdi i just wanted to let you know that I love you alot and you mean so much to me. you are the bestest friend i ever had and ilsym. you are an epic soul and you deserve all the happiness and joy in the whole world. thank you for being gentle even if the world fails to do the same for you.</p>
                                            <p>i hope that you always remember the lasting impact you had on me with your presence and I'm genuinely so glad to have you as my dearest friend. you are so hardworking it's so admirable but you still choose to stay humble about it, thats so cute and nice of you. i adore you so much you adorable little munchkin.</p>
                                            <p>im so happy to have become such good friends with you and one once again i love you. happy birthday rabdi!</p>
                                            <p class="signature">~ Sattu</p>
                                        `;
                                        document.body.appendChild(messageContainer);
                                        
                                        // Fade it in beautifully
                                        messageContainer.style.animation = 'fadeInMessage 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                                    }, 9500); // Trigger at 9.5s as the previous text finishes fading out

                                }, 4000); // Wait 4s for the fade to black to complete
                            }, 7500); // 2.5s for hardReveal animation to finish + 5s wait time
                        }
                    });
                }, 2500);
            }
        }, 40500); // Trigger super early (1.8s into Phase 7) for a dramatic overlapping reveal

        // Phase 9 removed as requested
    } // End of startExperience()

    // Updated function takes a 'pad' boolean to control the leading zeros, now returns a Promise
    function animateValue(id, start, end, duration, pad = true) {
        return new Promise((resolve) => {
            const obj = document.getElementById(id);
            let startTimestamp = null;

            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const linearProgress = Math.min((timestamp - startTimestamp) / duration, 1);

                // Easing curve: "ease-out quart"
                const easeProgress = 1 - Math.pow(1 - linearProgress, 4);

                // Calculate current value based on the curved progress
                const currentVal = Math.round(easeProgress * (end - start) + start);

                // Format with or without leading zero depending on the 'pad' variable
                if (obj) obj.innerText = pad ? currentVal.toLocaleString().padStart(2, '0') : currentVal.toLocaleString();

                // Continue animation if not reached 100%
                if (linearProgress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    // Ensure it perfectly lands on the final value
                    if (obj) obj.innerText = pad ? end.toLocaleString().padStart(2, '0') : end.toLocaleString();
                    resolve();
                }
            };

            window.requestAnimationFrame(step);
        });
    }
});