'use strict';
{
    function setTheme(mode) {
        if (mode !== "light" && mode !== "dark" && mode !== "auto") {
            mode = "auto";
        }
        document.documentElement.dataset.theme = mode;
        localStorage.setItem("theme", mode);
    }

    function cycleTheme(e) {
        const currentTheme = localStorage.getItem("theme") || "auto";
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const iconAuto = document.getElementById("icon-auto");
        const iconLight = document.getElementById("icon-light");
        const iconDark = document.getElementById("icon-dark");
        const iconAllThree = document.getElementById("icon-all-three");

        const icons = [
            iconAuto, iconLight, iconDark, iconAllThree
        ];

        const moveIcons = (cssClass) => {
            let deleteClass = null;

            if (cssClass === "icon-move-1"){
                deleteClass = "icon-move-0";
            } else {
                deleteClass = "icon-move-0";
            }

            icons.forEach((e) => {
                e.classList.add(cssClass);
                e.classList.remove(deleteClass);
            });
        };

        if (prefersDark) {
            // Auto (dark) -> Light -> Dark
            if (currentTheme === "auto") {
                setTheme("light");
                moveIcons("icon-move-1");
            } else if (currentTheme === "light") {
                setTheme("dark");
                moveIcons("icon-move-0");
            } else {
                setTheme("auto");
                moveIcons("icon-move-1");
            }
        } else {
            // Auto (light) -> Dark -> Light
            if (currentTheme === "auto") {
                setTheme("dark");
                moveIcons("icon-move-1");
            } else if (currentTheme === "dark") {
                setTheme("light");
                moveIcons("icon-move-0");
            } else {
                setTheme("auto");
                moveIcons("icon-move-0");
            }
        }
    }

    function initTheme() {
        // set theme defined in localStorage if there is one, or fallback to auto mode
        const currentTheme = localStorage.getItem("theme");
        currentTheme ? setTheme(currentTheme) : setTheme("auto");
    }

    window.addEventListener('load', function(_) {
        const buttons = document.getElementsByClassName("theme-toggle");
        Array.from(buttons).forEach((btn) => {
            btn.addEventListener("click", cycleTheme);
        });
    });

    initTheme();
}
