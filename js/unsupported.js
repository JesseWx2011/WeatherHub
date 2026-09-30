/*
  Unsupported Device qualifications:

  Windows Vista and below.
    macOS 10.8 and below.
    Linux devices reporting a 2.x kernel.
  Any device that released in 2012 or earlier.
  Browsers:
    - Internet Explorer (fully discontinued)
    - Firefox 52 and below.
    - Safari 10 and below.
    - Chrome 49 and below.

*/

// AI did write a good chunk of this section but I did the user agent checking. 9/6/2026

function checkDeviceStats() {
    const userAgent = navigator.userAgent;
    const reportedPlatform = navigator.userAgentData
        ? navigator.userAgentData.platform
        : navigator.platform || "";
    const platform = reportedPlatform ||
        (/Android/i.test(userAgent) ? "Android" :
            /Windows/i.test(userAgent) ? "Windows" :
                /Macintosh|Mac OS X/i.test(userAgent) ? "macOS" :
                    /Linux/i.test(userAgent) ? "Linux" :
                        "Unknown platform");

    let detectedPlatform = platform;
    let minimumRequirement = "a newer supported operating system";

    if (/Windows NT 6\.0/i.test(userAgent)) {
        detectedPlatform = "Windows Vista";
        minimumRequirement = "Windows 7";
    } else if (/Windows NT 5\./i.test(userAgent)) {
        detectedPlatform = /Windows NT 5\.1/i.test(userAgent)
            ? "Windows XP"
            : "Windows 2000 or earlier";
        minimumRequirement = "Windows 7";
    } else if (/Mac OS X 10_[0-8](?:_|$)/i.test(userAgent)) {
        const macVersion = userAgent.match(/Mac OS X 10_([0-8])(?:_|$)/i);
        detectedPlatform = "macOS 10." + macVersion[1];
        minimumRequirement = "macOS 10.9 or newer";
    } else if (/Linux 2\./i.test(userAgent)) {
        detectedPlatform = "Linux with a 2.x kernel";
        minimumRequirement = "a Linux distribution with a kernel newer than 2.x";
    } else if (/MSIE|Trident/i.test(userAgent)) {
        minimumRequirement = "a modern browser such as Chrome, Firefox, Safari, or Edge";
    }

    const unsupported =
        /MSIE|Trident/i.test(userAgent) ||
        /Windows NT 5\.|Windows NT 6\.0/i.test(userAgent) ||
        /Windows XP|Windows Vista/i.test(detectedPlatform) ||
        /Mac OS X 10_[0-8](?:_|$)/i.test(userAgent) ||
        /Linux 2\./i.test(userAgent);

    if (unsupported) {
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 20%; font-family: "Arial", sans-serif;">
                <h1>Unsupported Device</h1>
                <p>It seems that your device or browser is not supported by WeatherHub.</p>
                <p>Please consider updating your browser or using a different device for the best experience.</p>

                <br>
                <p>Your platform is ${detectedPlatform}.</p>
                <p>The minimum requirement for this website to work is ${minimumRequirement}.</p>

                <br>

                <p>Think this is a mistake? Contact me at <a href="mailto:jesselikeswx@outlook.com">jesselikeswx@outlook.com.<a> Be sure to clearly <br> state your browser and your operating system in your email.</p>
            </div>
        `;

    }
}

checkDeviceStats();