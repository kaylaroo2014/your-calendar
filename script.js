console.log("JavaScript is connected!");

const startDate = document.getElementById("start-date");

const calendar = document.getElementById("calendar");

const workerName = document.getElementById("worker-name");

const rotationWarning = document.getElementById("rotation-warning");

const savedScheduleStart = localStorage.getItem("scheduleStart");

const savedWorkerName = localStorage.getItem("workerName");

const rotationStatus = document.getElementById("rotation-status");

const clearSelectionButton = document.getElementById("clear-selection");

const todayButton = document.getElementById("today-button");

const eventPopup = document.getElementById("event-popup");

const eventPopupTitle = document.getElementById("event-popup-title");

const eventInput = document.getElementById("event-input");

const eventNotes = document.getElementById("event-notes");

const cancelEventButtoin = document.getElementById("cancel-event");

const saveEventButton = document.getElementById("save-event");

const deleteEventButton = document.getElementById("delete-event");

const eventRepeatSelect = document.getElementById("event-repeat");

const addAnotherEventButton  = document.getElementById("add-another-event");

const eventChooser = document.getElementById("event-chooser");

const eventChooserList = document.getElementById("event-chooser-list");

const eventDetailsPopup = document.getElementById("event-details-popup");

const eventDetailsName = document.getElementById("event-details-name");

const eventDetailsDate = document.getElementById("event-details-date");

const eventDetailsRepeat = document.getElementById("event-details-repeat");

const eventDetailsNotes = document.getElementById("event-details-notes");

const closeEventDetailsButton = document.getElementById("close-event-details");

const editEventDetailsButton = document.getElementById("edit-event-details");

let selectedEventDate = null;

let selectedEventDay = null;

let selectedRecurringEvent = null;

let selectedEventDayOfMonth = null;

let selectedEventMonth = null;

let selectedDetailsEvent = null;

let selectedDetailsRepeat = null;

let selectedDetailsDate = null;

function getAutoTheme() {
    const month = new Date().getMonth();

    const themes = [
        "winter",       // January
        "valentines",   // February
        "stpatricks",   // March
        "spring",       // April
        "early-summer", // May
        "summer",       // June
        "fourth-july",  // July
        "back-school",  // August
        "harvest",      // September
        "halloween",    // October
        "autumn",       // November
        "christmas"     // December
    ];

    return themes[month];
}
document.body.dataset.theme = getAutoTheme();
let personalEvents = JSON.parse(localStorage.getItem("personalEvents")) || {};
let recurringEvents = JSON.parse(localStorage.getItem("recurringEvents")) || {};
let monthlyEvents = JSON.parse(localStorage.getItem("monthlyEvents")) || {};
let yearlyEvents = JSON.parse(localStorage.getItem("yearlyEvents")) || {};

if (savedWorkerName) {
    workerName.value = savedWorkerName;
}
if (savedScheduleStart) {
    startDate.value = savedScheduleStart;
}

const monthTitle = document.getElementById("month-title");
const previousMonthButton = document.getElementById("previous-month");
const nextMonthButton = document.getElementById("next-month");

let displayedDate = new Date();
const savedSelections = localStorage.getItem("shiftSelections");
const savedRotationStart = localStorage.getItem("rotationStart");
const savedRotationEnd = localStorage.getItem("rotationEnd");

let rotationStart = savedRotationStart || null;
let rotationEnd = savedRotationEnd || null;

const shiftSelections = savedSelections? JSON.parse(savedSelections)
: {};
// Version 2.0 — Automatic rotation settings
let autoRotationV2 = JSON.parse(
    localStorage.getItem("autoRotationV2") || "null"
);
// Version 2.0 — Calculate the 2-2-3 work pattern
function get223Shift(daysFromStart, shift) {
    const pattern = [
        true, true, false, false, true, true, true,
        false, false, true, true, false, false, false
    ];

    const dayIndex = ((daysFromStart % 14) + 14) % 14;

    return pattern[dayIndex] ? shift : null;
}
// Version 2.0 — Calculate the 4 On / 4 Off pattern
function get4On4OffShift(daysFromStart, shift) {
    const dayIndex = ((daysFromStart % 8) + 8) % 8;

    return dayIndex < 4 ? shift : null;
}
// Version 2.0 — Monday through Friday work schedule
function getMondayFridayShift(date, shift) {
    const dayOfWeek = date.getDay();

    return dayOfWeek >= 1 && dayOfWeek <= 5 ? shift : null;
}
// Version 2.0 — Custom days on / days off rotation
function getCustomShift(daysFromStart, shift, daysOn, daysOff) {
    const cycleLength = daysOn + daysOff;
    const dayIndex = ((daysFromStart % cycleLength) + cycleLength) % cycleLength;

    return dayIndex < daysOn ? shift : null;
}
// Version 2.0 — Count calendar days between two dates
function getRotationDayDifference(startDateString, date) {
    const [year, month, day] = startDateString.split("-").map(Number);

    const startUTC = Date.UTC(year, month - 1, day);
    const currentUTC = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    return Math.round((currentUTC - startUTC) / 86400000);
}
// Version 2.0 — Alternate Day/Night shifts every 2 weeks
function getAlternating2WeekShift(daysFromStart, firstShift) {
    const twoWeekBlock = Math.floor(daysFromStart / 14);
    const startsOnDays = firstShift === "Day";

    const isDayShift = twoWeekBlock % 2 === 0
        ? startsOnDays
        : !startsOnDays;

    return isDayShift ? "D" : "N";
}
// Version 2.0 — Alternate shifts between work blocks
function getAlternatingWorkBlockShift(blockNumber, firstShift) {
    const startsOnDays = firstShift === "Day";

    const isDayShift = blockNumber % 2 === 0
        ? startsOnDays
        : !startsOnDays;

    return isDayShift ? "D" : "N";
}
// Version 2.0 — Check whether a date is a scheduled workday
function isAutoRotationWorkdayV2(date) {
    if (!autoRotationV2) return false;

    const { schedule, startDate, daysOn, daysOff } = autoRotationV2;
    const days = getRotationDayDifference(startDate, date);

    if (days < 0) return false;

    if (schedule === "223") {
        return get223Shift(days, "D") !== null;
    }

    if (schedule === "4on4off") {
        return get4On4OffShift(days, "D") !== null;
    }

    if (schedule === "5on2off") {
        return getMondayFridayShift(date, "D") !== null;
    }

    if (schedule === "custom") {
        return getCustomShift(days, "D", daysOn, daysOff) !== null;
    }

    return false;
}
// Version 2.0 — Count work blocks for alternating shifts
function getAutoRotationBlockNumberV2(date) {
    const daysFromStart = getRotationDayDifference(
        autoRotationV2.startDate,
        date
    );

    let blockNumber = -1;
    let previousWasWorkday = false;

    const [year, month, day] = autoRotationV2.startDate
        .split("-")
        .map(Number);

    const current = new Date(year, month - 1, day);

    for (let i = 0; i <= daysFromStart; i++) {
        const isWorkday = isAutoRotationWorkdayV2(current);

        if (isWorkday && !previousWasWorkday) {
            blockNumber++;
        }

        previousWasWorkday = isWorkday;
        current.setDate(current.getDate() + 1);
    }

    return blockNumber;
}
// Version 2.0 — Determine automatic shift for a date
function getAutoRotationShiftV2(date) {
    if (!autoRotationV2) return null;

    const {
        schedule, shift, startDate,
        firstShift, daysOn, daysOff
    } = autoRotationV2;

    if (!schedule || !shift || !startDate) return null;

    const daysFromStart = getRotationDayDifference(startDate, date);

    if (daysFromStart < 0) return null;

    // Check the work schedule FIRST — days off stay off!
    if (!isAutoRotationWorkdayV2(date)) return null;

    // Decide whether this working day is Days or Nights
    if (shift === "Alternating2Weeks") {
        return getAlternating2WeekShift(daysFromStart, firstShift);
    }

    if (shift === "AlternatingBlocks") {
        const blockNumber = getAutoRotationBlockNumberV2(date);
        return getAlternatingWorkBlockShift(blockNumber, firstShift);
    }

    // Permanent Day or Night Shift
    return shift === "Day" ? "D" : "N";
}
const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

let rotationStartDate = null;
let rotationEndDate = null;
let rotationPattern = [];

function buildRotationPattern() {
    rotationPattern = [];

    let startParts = rotationStart.split("-");

    let currentDate = new Date(
        Number(startParts[0]),
        Number(startParts[1]) - 1,
        Number(startParts[2])
    );

    let endParts = rotationEnd.split("-");

    let endDate = new Date(
        Number(endParts[0]),
        Number(endParts[1]) - 1,
        Number(endParts[2])
    );

    while (currentDate <= endDate) {

        let dateKey =
        currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1) + "-" +
        currentDate.getDate();

let shift = shiftSelections[dateKey] || "OFF";
rotationPattern.push(shift);

        currentDate.setDate(currentDate.getDate() + 1);
    }

}

if (rotationStart && rotationEnd) {
    buildRotationPattern();
}

function getShiftForDate(date) {
    let startParts = rotationStart.split("-");

    let startDate = new Date(
        Number(startParts[0]),
        Number(startParts[1]) - 1,
        Number(startParts[2])
    );

    let startUTC = Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
    );

    dateUTC = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    let daysFromStart = Math.round(
        (dateUTC - startUTC) / (1000 * 60 * 60 * 24)
    );

    let patternIndex = daysFromStart % rotationPattern.length;
    return rotationPattern[patternIndex];
}

function resetEventPopup() {
    eventChooser.style.display = "none";
    eventChooserList.innerHTML = "";

    eventInput.style.display = "block";
    eventInput.value = "";
    eventNotes.value = "";

    eventRepeatSelect.parentElement.style.display = "block";
    eventRepeatSelect.value = "none";

    saveEventButton.style.display = "inline-block";
    deleteEventButton.style.display = "none";

    selectedRecurringEvent = null;
}

function renderCalendar() {
    calendar.innerHTML = "";
    rotationStartDate = null;
    rotationEndDate = null;

    const today = new Date();

    monthTitle.textContent = 
    monthNames[displayedDate.getMonth()] + " " + displayedDate.getFullYear();
// VERSION 2.0 — Seasonal month icons
const monthSeasonIcon = document.getElementById("month-season-icon");

if (displayedDate.getMonth() === 9) {
    monthSeasonIcon.innerHTML = `
    <svg viewBox="0 0 32 32" width="26" height="26"
         aria-hidden="true" style="display:block">
        <path d="M16 10 Q15 6 19 5"
              fill="none" stroke="#6D8258"
              stroke-width="2" stroke-linecap="round"/>
        <path d="M15 10 Q7 4 4 15 Q2 25 13 27
                 L19 27 Q30 25 28 15 Q25 4 17 10Z"
              fill="#D88D57" stroke="#A76C43"
              stroke-width="1"/>
        <path d="M16 10 Q10 13 11 23 M16 10 Q22 13 21 23"
              stroke="#B8754D" stroke-width="1.3"
              fill="none" stroke-linecap="round"/>
    </svg>
`;
        monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 10) {
    monthSeasonIcon.innerHTML = `
        <svg viewBox="0 0 32 32" width="26" height="26"
             aria-hidden="true" style="display:block">
            <path d="M16 27 C10 21 4 20 5 13
                     L10 14 L9 8 L14 10
                     L16 4 L19 10 L24 8
                     L23 14 L28 13
                     C28 20 22 22 16 27Z"
                  fill="#C4836C" stroke="#AC6D48"
                  stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M16 27 L16 11 M16 20 L10 15
                     M16 19 L23 14"
                  fill="none" stroke="#AC6D48"
                  stroke-width="1.1" stroke-linecap="round"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 11) {
    monthSeasonIcon.innerHTML = `
        <svg viewBox="0 0 32 32" width="26" height="26"
             aria-hidden="true" style="display:block">
            <path d="M16 7 L7 19 H11 L5 25 H27 L21 19 H25 Z"
                  fill="#557363"
                  stroke="#365244"
                  stroke-width="1"
                  stroke-linejoin="round"/>
            <rect x="14" y="25" width="4" height="4"
                  rx="0.7" fill="#98704E"/>
            <path d="M16 2 L17.3 5 H20.5 L18 7
                     L19 10 L16 8 L13 10 L14 7
                     L11.5 5 H14.7 Z"
                  fill="#D8B56A"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
    } else if (displayedDate.getMonth() === 0) {
    monthSeasonIcon.innerHTML = `
        <svg viewBox="0 0 32 32" width="26" height="26"
             aria-hidden="true" style="display:block">
            <g fill="none" stroke="#7FA8BF"
               stroke-width="1.8"
               stroke-linecap="round"
               stroke-linejoin="round">
                <path d="M16 3 V29 M3 16 H29
                         M6.8 6.8 L25.2 25.2
                         M25.2 6.8 L6.8 25.2"/>
                <path d="M12 7 L16 11 L20 7
                         M12 25 L16 21 L20 25
                         M7 12 L11 16 L7 20
                         M25 12 L21 16 L25 20"/>
            </g>
            <circle cx="16" cy="16" r="2"
                    fill="#C8BEDF"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
    } else if (displayedDate.getMonth() === 1) {
    monthSeasonIcon.innerHTML = `
        <svg viewBox="0 0 32 32" width="26" height="26"
             aria-hidden="true" style="display:block">
            <path d="M16 27
                     C12 23 4 17 4 11
                     C4 6 8 4 12 5
                     C14 5.5 15.5 7 16 8.5
                     C16.5 7 18 5.5 20 5
                     C24 4 28 6 28 11
                     C28 17 20 23 16 27Z"
                  fill="#B77B8D"
                  stroke="#965A70"
                  stroke-width="1.2"
                  stroke-linejoin="round"/>
            <path d="M9 10 C10 8 12 8 13 9"
                  fill="none"
                  stroke="#EAD9DE"
                  stroke-width="1.8"
                  stroke-linecap="round"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 2) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">
            <g fill="#6F9675">
                <circle cx="25" cy="22" r="11"/>
                <circle cx="39" cy="22" r="11"/>
                <circle cx="21" cy="36" r="11"/>
                <circle cx="43" cy="36" r="11"/>
            </g>
            <path d="M32 34 Q35 47 29 57"
                  fill="none"
                  stroke="#476451"
                  stroke-width="4"
                  stroke-linecap="round"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 3) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M32 35 L32 57"
                  stroke="#789C80"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  fill="none"/>
            <path d="M32 49 Q18 47 17 38 Q29 40 32 49"
                  fill="#B8CDB7"/>
            <path d="M32 53 Q45 50 47 41 Q37 42 32 53"
                  fill="#91B092"/>
            <path d="M18 18 L25 23 L32 12 L39 23 L46 18
                     L44 32 Q32 45 20 32 Z"
                  fill="#DF8EAE"
                  stroke="#B86B90"
                  stroke-width="1.5"
                  stroke-linejoin="round"/>
            <path d="M32 13 L32 39"
                  stroke="#B86B90"
                  stroke-width="1.5"
                  stroke-linecap="round"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 4) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">
            <g fill="#F0C76E" stroke="#D9A94D" stroke-width="1">
                <ellipse cx="32" cy="16" rx="7" ry="12"/>
                <ellipse cx="32" cy="48" rx="7" ry="12"/>
                <ellipse cx="16" cy="32" rx="12" ry="7"/>
                <ellipse cx="48" cy="32" rx="12" ry="7"/>
                <ellipse cx="21" cy="21" rx="7" ry="11"
                         transform="rotate(-45 21 21)"/>
                <ellipse cx="43" cy="21" rx="7" ry="11"
                         transform="rotate(45 43 21)"/>
                <ellipse cx="21" cy="43" rx="7" ry="11"
                         transform="rotate(45 21 43)"/>
                <ellipse cx="43" cy="43" rx="7" ry="11"
                         transform="rotate(-45 43 43)"/>
            </g>
            <circle cx="32" cy="32" r="10"
                    fill="#D99579"
                    stroke="#B9765D"
                    stroke-width="1.5"/>
            <circle cx="29" cy="29" r="2" fill="#F5DCA5"/>
            <circle cx="35" cy="34" r="1.5" fill="#F5DCA5"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else if (displayedDate.getMonth() === 5) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">

            <!-- Wooden stick -->
            <rect x="29" y="45" width="6" height="15"
                  rx="3" fill="#D5AE7E"/>

            <!-- Turquoise popsicle -->
            <path d="M18 25 Q18 8 32 8 Q46 8 46 25
                     L46 44 Q46 49 41 49 L23 49
                     Q18 49 18 44 Z"
                  fill="#54A9B8"/>

            <!-- Sunny yellow stripe -->
            <path d="M18 25 H46 V33 H18 Z"
                  fill="#F5DCA5"/>

            <!-- Coral bottom -->
            <path d="M18 33 H46 V44 Q46 49 41 49
                     H23 Q18 49 18 44 Z"
                  fill="#EBA998"/>

            <!-- Outline -->
            <path d="M18 25 Q18 8 32 8 Q46 8 46 25
                     L46 44 Q46 49 41 49 L23 49
                     Q18 49 18 44 Z"
                  fill="none"
                  stroke="#358697"
                  stroke-width="1.5"/>

            <!-- Little shine -->
            <path d="M24 19 V39"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  stroke-linecap="round"
                  opacity="0.55"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";

} else if (displayedDate.getMonth() === 6) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">

            <!-- Red firework rays -->
            <g stroke="#C85D62"
               stroke-width="3"
               stroke-linecap="round">
                <path d="M32 5 V17 M32 47 V59
                         M5 32 H17 M47 32 H59"/>
            </g>

            <!-- Blue diagonal sparks -->
            <g stroke="#6E8FB6"
               stroke-width="3"
               stroke-linecap="round">
                <path d="M13 13 L22 22
                         M42 42 L51 51
                         M51 13 L42 22
                         M22 42 L13 51"/>
            </g>

            <!-- Golden center star -->
            <path d="M32 19 L35.5 27.5 L45 28
                     L38 34.5 L40 44 L32 39
                     L24 44 L26 34.5 L19 28
                     L28.5 27.5 Z"
                  fill="#E6C77C"
                  stroke="#C85D62"
                  stroke-width="1.5"/>

            <!-- Extra sparkles -->
            <circle cx="11" cy="45" r="2.5"
                    fill="#6E8FB6"/>
            <circle cx="53" cy="19" r="2.5"
                    fill="#E6C77C"/>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";

} else if (displayedDate.getMonth() === 7) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">

            <!-- Pencil tilted diagonally -->
            <g transform="rotate(38 32 32)">

                <!-- Yellow pencil body -->
                <rect x="25" y="13"
                      width="14" height="34"
                      fill="#F2C75C"
                      stroke="#BD9345"
                      stroke-width="1.5"/>

                <!-- Pink eraser -->
                <path d="M25 13 H39 V20 H25 Z"
                      fill="#E5A4A8"/>

                <!-- Silver eraser band -->
                <rect x="25" y="19"
                      width="14" height="4"
                      fill="#A4A9AF"/>

                <!-- Wooden sharpened tip -->
                <path d="M25 47 L32 59 L39 47 Z"
                      fill="#D6B38B"
                      stroke="#BD9345"
                      stroke-width="1.2"/>

                <!-- Graphite point -->
                <path d="M29 54 L32 59 L35 54 Z"
                      fill="#454C55"/>

                <!-- Pencil shine -->
                <path d="M32 24 V45"
                      stroke="#FFF2B5"
                      stroke-width="2.5"
                      stroke-linecap="round"/>

            </g>
        </svg>
    `;
    monthSeasonIcon.style.display = "inline";

} else if (displayedDate.getMonth() === 8) {
    monthSeasonIcon.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 64 64"
             xmlns="http://www.w3.org/2000/svg">

            <!-- Brown apple stem -->
            <path d="M32 19 Q30 10 36 7"
                  fill="none"
                  stroke="#574432"
                  stroke-width="3"
                  stroke-linecap="round"/>

            <!-- Green leaf -->
            <path d="M32 17 Q18 6 16 17 Q23 25 32 17"
                  fill="#779064"
                  stroke="#53754C"
                  stroke-width="1.5"/>

            <!-- Red apple -->
            <path d="M32 25
                     C18 14 8 26 13 43
                     C17 58 26 58 32 54
                     C38 58 47 58 51 43
                     C56 26 46 14 32 25 Z"
                  fill="#B94F4A"
                  stroke="#97403B"
                  stroke-width="2"/>

            <!-- Soft apple shine -->
            <path d="M20 30 Q16 36 20 44"
                  fill="none"
                  stroke="#D98278"
                  stroke-width="3"
                  stroke-linecap="round"/>

        </svg>
    `;
    monthSeasonIcon.style.display = "inline";
} else {

    monthSeasonIcon.textContent = "";
    monthSeasonIcon.style.display = "none";
}

    const firstDay = new Date(
        displayedDate.getFullYear(),
        displayedDate.getMonth(),
        1
    );

    const startingPosition = firstDay.getDay();

    const lastDay = new Date(
    displayedDate.getFullYear(),
    displayedDate.getMonth() + 1,
    0
);
const daysInMonth = lastDay.getDate();
for (let empty = 0; empty < startingPosition; empty++) {
    const emptyBox = document.createElement("div");
    emptyBox.classList.add("calendar-cell:");
    calendar.appendChild(emptyBox);
}

if (rotationStart) {
    rotationStartDate = new Date(rotationStart);
}

if (rotationEnd) {
    rotationEndDate = new Date(rotationEnd);
}

for (let day = 1; day <= daysInMonth; day++) {

    const currentDate = new Date(
        displayedDate.getFullYear(),
        displayedDate.getMonth(),
        day
    );

    const dateKey = 
    currentDate.getFullYear() + "-" +
    (currentDate.getMonth() + 1) + "-" +
    currentDate.getDate();

    let generatedShift = null;
    if (rotationPattern.length > 0 && currentDate > rotationEndDate) {
        generatedShift = getShiftForDate(currentDate);
    }


    const dayBox = document.createElement("div");
    const today = new Date();
    const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    if (isToday) {
    dayBox.classList.add("today");
}
if (isWeekend) {
    dayBox.classList.add("weekend");
}
    dayBox.classList.add("calendar-cell");

if (dateKey === rotationStart && rotationEnd === null) {
    dayBox.classList.add("rotation-boundary");
}

if (dateKey === rotationEnd && rotationStart === null) {
    dayBox.classList.add("rotation-boundary");
}

    if (
        rotationStartDate &&
        rotationEndDate &&
        currentDate >= rotationStartDate &&
        currentDate <= rotationEndDate
    ) {
        dayBox.classList.add("rotation-boundary");
    }

    const dateNumber = document.createElement("div");
dateNumber.classList.add("date-number");
dateNumber.textContent = day;

if (
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate()
) {
    dateNumber.classList.add("today");
}
dayBox.appendChild(dateNumber);
// VERSION 2.0 — Show one calendar icon if this date has events
const dayOfWeekForIcon = currentDate.getDay();
const dayOfMonthForIcon = currentDate.getDate();
const yearlyKeyForIcon = currentDate.getMonth() + "-" + currentDate.getDate();

const hasEvents =
    !!personalEvents[dateKey] ||
    (recurringEvents[dayOfWeekForIcon] || []).length > 0 ||
    (monthlyEvents[dayOfMonthForIcon] || []).length > 0 ||
    (yearlyEvents[yearlyKeyForIcon] || []).length > 0;

if (hasEvents) {
    const eventIcon = document.createElement("span");
    eventIcon.classList.add("event-calendar-icon");
    eventIcon.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16"
         fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2"></rect>
        <path d="M7 3v4M17 3v4M3 10h18"></path>
        <path d="M8 14h2M14 14h2M8 17h2"></path>
    </svg>
`;
    eventIcon.setAttribute("aria-label", "Events scheduled");
    dayBox.appendChild(eventIcon);
}

if (personalEvents[dateKey]) {
    const personalEvent = document.createElement("div");

    personalEvent.classList.add("personal-event");
    personalEvent.classList.add("single-event");
    personalEvent.textContent = personalEvents[dateKey].name;
    personalEvent.addEventListener("click", function(event) {
    event.stopPropagation();
    selectedDetailsEvent = personalEvents[dateKey];
    selectedDetailsRepeat = "none";
    selectedDetailsDate = currentDate;

    eventDetailsName.textContent = personalEvents[dateKey].name;
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsRepeat.textContent = "Does not repeat";
    eventDetailsNotes.textContent = personalEvents[dateKey].notes;

    eventDetailsPopup.style.display = "block";
});
    dayBox.appendChild(personalEvent);
}

const dayOfWeek = currentDate.getDay();

if (Array.isArray(recurringEvents[dayOfWeek])) {
    recurringEvents[dayOfWeek].forEach(function(eventText) {
        const recurringEvent = document.createElement("div");

        recurringEvent.classList.add("personal-event");
        recurringEvent.classList.add("weekly-event");
        recurringEvent.textContent = eventText.name;
recurringEvent.addEventListener("click", function(event) {
    event.stopPropagation();
selectedDetailsEvent = eventText;
selectedDetailsRepeat = "weekly";
selectedDetailsDate = currentDate;
    eventDetailsName.textContent = eventText.name;
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsRepeat.textContent = "Repeats every week";
    eventDetailsNotes.textContent = eventText.notes;

    eventDetailsPopup.style.display = "block";
});
        dayBox.appendChild(recurringEvent);
    });
}

const dayOfMonth = currentDate.getDate();

if (Array.isArray(monthlyEvents[dayOfMonth])) {
    monthlyEvents[dayOfMonth].forEach(function(eventText) {
        const monthlyEvent = document.createElement("div");

        monthlyEvent.classList.add("personal-event");
        monthlyEvent.classList.add("monthly-event");
        monthlyEvent.textContent = eventText.name;
monthlyEvent.addEventListener("click", function(event) {
    event.stopPropagation();
selectedDetailsEvent = eventText;
selectedDetailsRepeat = "monthly";
selectedDetailsDate = currentDate;
    eventDetailsName.textContent = eventText.name;
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsRepeat.textContent = "Repeats every month";
    eventDetailsNotes.textContent = eventText.notes;

    eventDetailsPopup.style.display = "block";
});
        dayBox.appendChild(monthlyEvent);
    });
}
const yearlyKey = currentDate.getMonth() + "-" + currentDate.getDate();
if (Array.isArray(yearlyEvents[yearlyKey])) {
yearlyEvents[yearlyKey].forEach(function(eventText) {
const yearlyEvent = document.createElement("div");

yearlyEvent.classList.add("personal-event");
yearlyEvent.classList.add("yearly-event");
yearlyEvent.textContent = eventText.name;
yearlyEvent.addEventListener("click", function(event) {
    event.stopPropagation();
selectedDetailsEvent = eventText;
selectedDetailsRepeat = "yearly";
selectedDetailsDate = currentDate;
    eventDetailsName.textContent = eventText.name;
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsRepeat.textContent = "Repeats every year";
    eventDetailsNotes.textContent = eventText.notes;

    eventDetailsPopup.style.display = "block";
});
dayBox.appendChild(yearlyEvent);
});
}

dayBox.addEventListener("contextmenu", function(event) {
    event.preventDefault();
    return;
    event.preventDefault();
    resetEventPopup();


    selectedEventDate = dateKey;
    selectedEventDay = currentDate.getDay();
    selectedRecurringEvent = null;
    selectedEventDayOfMonth = currentDate.getDate();
    selectedEventMonth = currentDate.getMonth();

    const recurringEventsForDay = recurringEvents[selectedEventDay] || [];
    const monthlyEventsForDay = monthlyEvents[selectedEventDayOfMonth] || [];
    const yearlyKey = selectedEventMonth + "-" + selectedEventDayOfMonth;
    const yearlyEventsForDay = yearlyEvents[yearlyKey] || [];

    const personalEventsForDay = personalEvents[dateKey] ? [personalEvents[dateKey]] : [];
    const allEventsForDay = [
    ...personalEventsForDay,
    ...recurringEventsForDay,
    ...monthlyEventsForDay,
    ...yearlyEventsForDay
];

if (allEventsForDay.length > 1) {
    eventChooser.style.display = "block";
    eventChooserList.innerHTML = "";

    eventInput.style.display = "none";
    eventRepeatSelect.parentElement.style.display = "none";
    saveEventButton.style.display = "none";
    deleteEventButton.style.display = "none";

    allEventsForDay.forEach(function(eventText) {
        const eventButton = document.createElement("button");

        eventButton.textContent = eventText.name;


        const isPersonal = personalEventsForDay.includes(eventText);
        const isMonthly = monthlyEventsForDay.includes(eventText);
        const isYearly = yearlyEventsForDay.includes(eventText);
        eventButton.classList.add(
    isPersonal ? "single-event" :
    isMonthly ? "monthly-event" :
    isYearly ? "yearly-event" :
    "weekly-event"
);
        if (isPersonal) {
    eventButton.classList.add("chooser-never");
} else if (isMonthly) {
    eventButton.classList.add("chooser-monthly");
} else if (isYearly) {
    eventButton.classList.add("chooser-yearly");
} else {
    eventButton.classList.add("chooser-weekly");
}
        
        eventButton.addEventListener("click", function() {

selectedRecurringEvent = eventText;

    eventChooser.style.display = "none";

    eventInput.style.display = "block";
    eventRepeatSelect.parentElement.style.display = "block";
    saveEventButton.style.display = "inline-block";
    deleteEventButton.style.display = "block";

    eventInput.value = eventText.name;
    eventNotes.value = eventText.notes;
    if (isPersonal) {
    eventRepeatSelect.value = "none";
    } else if (isYearly) {
    eventRepeatSelect.value = "yearly";
} else if (isMonthly) {
    eventRepeatSelect.value = "monthly";
} else {
    eventRepeatSelect.value = "weekly";
}

    eventInput.focus();
});

        eventChooserList.appendChild(eventButton);
    });


} else if (allEventsForDay.length === 1) {
    selectedRecurringEvent = allEventsForDay[0];
eventInput.value = allEventsForDay[0].name;
eventNotes.value = allEventsForDay[0].notes;

const isPersonal = personalEventsForDay.includes(allEventsForDay[0]);
const isMonthly = monthlyEventsForDay.includes(allEventsForDay[0]);
const isYearly = yearlyEventsForDay.includes(allEventsForDay[0]);

if (isPersonal) {
    eventRepeatSelect.value = "none";
} else if (isYearly) {
    eventRepeatSelect.value = "yearly";
} else if (isMonthly) {
    eventRepeatSelect.value = "monthly";
} else {
    eventRepeatSelect.value = "weekly";
}
    deleteEventButton.style.display = "block";

} else {
    eventInput.value = "";
    eventRepeatSelect.value = "none";
    deleteEventButton.style.display = "none";
}

eventPopup.style.display = "block";
eventPopupTitle.textContent = "Add to " + currentDate.toDateString();
eventInput.focus();
});

addAnotherEventButton.addEventListener("click", function() {
    selectedRecurringEvent = null;
    eventChooser.style.display = "none";
    eventInput.style.display = "block";
    eventRepeatSelect.parentElement.style.display = "block";
    saveEventButton.style.display = "inline-block";
    eventInput.value = "";
    eventNotes.value = "";
    eventRepeatSelect.value = "none";
    deleteEventButton.style.display = "none";
    eventInput.focus();
});

const isMobileCalendar = window.matchMedia("(max-width: 600px)").matches;
let mobileLongPressTimer = null;
let mobileLongPressTriggered = false;

dayBox.addEventListener("pointerdown", function() {
    if (!isMobileCalendar) {
        return;
    }

    if (rotationStart && rotationEnd) {
        return;
    }

    mobileLongPressTriggered = false;

    mobileLongPressTimer = setTimeout(function() {
        mobileLongPressTriggered = true;
        rotationStart = dateKey;
localStorage.setItem("rotationStart", rotationStart);

rotationWarning.textContent = "";
clearSelectionButton.style.display = "block";

dayBox.classList.add("rotation-boundary");
    }, 500);
});
dayBox.addEventListener("pointerup", function() {
    if (!isMobileCalendar) {
        return;
    }

    clearTimeout(mobileLongPressTimer);
});
dayBox.addEventListener("pointerleave", function() {
    if (!isMobileCalendar) {
        return;
    }

    clearTimeout(mobileLongPressTimer);
});

dayBox.addEventListener("click", function() {
    // VERSION 2.0 — Open Day View on desktop
if (true) {
    const dayView = document.getElementById("day-view-v2");
    const dayViewTitle = document.getElementById("day-view-title");

    dayViewTitle.dataset.date = dateKey;
    dayViewTitle.textContent = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    // VERSION 2.0 — Gather events for this date
const eventsForDay = [
    ...(personalEvents[dateKey] ? [personalEvents[dateKey]] : []),
    ...(recurringEvents[currentDate.getDay()] || []),
    ...(monthlyEvents[currentDate.getDate()] || []),
    ...(yearlyEvents[currentDate.getMonth() + "-" + currentDate.getDate()] || [])
];

const dayViewEvents = document.getElementById("day-view-events");
dayViewEvents.innerHTML = "";

if (eventsForDay.length === 0) {
    dayViewEvents.textContent = "No events scheduled.";
} else {
    eventsForDay.forEach(function(savedEvent) {
        const eventItem = document.createElement("div");
        eventItem.classList.add("day-view-event-item");
        eventItem.textContent = savedEvent.name;
        eventItem.style.cursor = "pointer";
        eventItem.addEventListener("click", function() {
    selectedDetailsEvent = savedEvent;
    selectedDetailsDate = currentDate;

    eventDetailsName.textContent = savedEvent.name;
    selectedDetailsRepeat =
    personalEvents[dateKey] === savedEvent ? "none" :
    (recurringEvents[currentDate.getDay()] || []).includes(savedEvent) ? "weekly" :
    (monthlyEvents[currentDate.getDate()] || []).includes(savedEvent) ? "monthly" :
    "yearly";
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsNotes.textContent = savedEvent.notes || "";
    // VERSION 2.0 — Show the correct repeat description
eventDetailsRepeat.textContent =
    selectedDetailsRepeat === "weekly" ? "Repeats every week" :
    selectedDetailsRepeat === "monthly" ? "Repeats every month" :
    selectedDetailsRepeat === "yearly" ? "Repeats every year" :
    "Does not repeat";

    document.getElementById("day-view-v2").style.display = "none";
    eventDetailsPopup.style.display = "block";
});
        dayViewEvents.appendChild(eventItem);
    });
}
// VERSION 2.0 — Remember which calendar day was clicked
document.querySelectorAll("#calendar .calendar-cell").forEach(function(cell) {
    cell.removeAttribute("data-day-view-selected");
});

dayBox.setAttribute("data-day-view-selected", "true");
    dayView.style.display = "block";
    return;
}
    if (isMobileCalendar) {
            if (mobileLongPressTriggered) {
        mobileLongPressTriggered = false;
        return;
    }
    if (rotationStart !== null && rotationEnd === null) {
    let startParts = rotationStart.split("-");
    let clickedParts = dateKey.split("-");

    let startDateObject = new Date(
        startParts[0],
        startParts[1] - 1,
        startParts[2]
    );

    let clickedDateObject = new Date(
        clickedParts[0],
        clickedParts[1] - 1,
        clickedParts[2]
    );

    if (clickedDateObject < startDateObject) {
        rotationWarning.textContent =
            "Hmm, that end date seems to be before your start date. Please check your rotation and try again.";
        return;
    }

    rotationWarning.textContent = "";
    rotationEnd = dateKey;
    localStorage.setItem("rotationEnd", rotationEnd);

    rotationStatus.innerHTML =
        '<span class="rotation-message">Rotation set!</span>';

    dayBox.classList.add("rotation-boundary");

    buildRotationPattern();
    renderCalendar();

    return;
}
        selectedEventDate = dateKey;
selectedEventDay = currentDate.getDay();
selectedEventDayOfMonth = currentDate.getDate();
selectedEventMonth = currentDate.getMonth();
selectedRecurringEvent = null;

    const mobileDayView = document.getElementById("mobile-day-view");
    const mobileDayTitle = document.getElementById("mobile-day-title");

    mobileDayTitle.textContent = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

const mobileDayEvents = document.getElementById("mobile-day-events");

const recurringEventsForDay = recurringEvents[currentDate.getDay()] || [];
const monthlyEventsForDay = monthlyEvents[currentDate.getDate()] || [];
const yearlyKey = currentDate.getMonth() + "-" + currentDate.getDate();
const yearlyEventsForDay = yearlyEvents[yearlyKey] || [];
const personalEventsForDay = personalEvents[dateKey] ? [personalEvents[dateKey]] : [];

const allEventsForMobileDay = [
    ...personalEventsForDay,
    ...recurringEventsForDay,
    ...monthlyEventsForDay,
    ...yearlyEventsForDay
];

mobileDayEvents.innerHTML = "";

if (allEventsForMobileDay.length === 0) {
    mobileDayEvents.innerHTML = "<p>No events for this day.</p>";
} else {
    allEventsForMobileDay.forEach(function(eventItem) {
        const eventButton = document.createElement("button");
        eventButton.textContent = eventItem.name;
        const isPersonal = personalEventsForDay.includes(eventItem);
        const isMonthly = monthlyEventsForDay.includes(eventItem);
        const isYearly = yearlyEventsForDay.includes(eventItem);
        const isWeekly = recurringEventsForDay.includes(eventItem);

eventButton.addEventListener("click", function() {
    selectedDetailsEvent = eventItem;
    selectedDetailsDate = currentDate;

    eventDetailsName.textContent = eventItem.name;
    eventDetailsDate.textContent = currentDate.toDateString();
    eventDetailsNotes.textContent = eventItem.notes;

    if (isPersonal) {
        selectedDetailsRepeat = "none";
        eventDetailsRepeat.textContent = "Does not repeat";
    } else if (isMonthly) {
        selectedDetailsRepeat = "monthly";
        eventDetailsRepeat.textContent = "Repeats every month";
    } else if (isYearly) {
        selectedDetailsRepeat = "yearly";
        eventDetailsRepeat.textContent = "Repeats every year";
    } else if (isWeekly) {
        selectedDetailsRepeat = "weekly";
        eventDetailsRepeat.textContent = "Repeats every week";
    }

    mobileDayView.style.display = "none";
    eventDetailsPopup.style.display = "block";
});

        mobileDayEvents.appendChild(eventButton);
    });
}

    mobileDayView.style.display = "block";
    return;
}
    
if (dateKey === rotationStart) {
    rotationStart = null;
    rotationWarning.textContent = "";
    rotationStatus.textContent = "";
    rotationPattern = [];
    localStorage.removeItem("rotationStart");

    if (rotationStart === null && rotationEnd === null) {
        clearSelectionButton.style.display = "none";
    }

    renderCalendar();
    return;
}

if (dateKey === rotationEnd) {
    rotationEnd = null;
    rotationStatus.textContent = "";
    rotationPattern = [];
    localStorage.removeItem("rotationEnd");

if (rotationStart === null && rotationEnd === null) {
    clearSelectionButton.style.display = "none";
}

    renderCalendar();
    return;
}

if (rotationStart === null) {

    if (rotationEnd) {
        let endParts = rotationEnd.split("-");
        let clickedParts = dateKey.split("-");

        let endDateObject = new Date(
            endParts[0],
            endParts[1] - 1,
            endParts[2]
        );

        let clickedDateObject = new Date(
            clickedParts[0],
            clickedParts[1] - 1,
            clickedParts[2]
        );
    

if (clickedDateObject > endDateObject) {
    rotationWarning.textContent = "Hmm, that start date seems to be after your end date. Please check your rotation and try again.";
    return;
}
    }

    rotationWarning.textContent = "";

    rotationStart = dateKey;
    localStorage.setItem("rotationStart", rotationStart);

    clearSelectionButton.style.display = "block";

    dayBox.classList.add("rotation-boundary");
    if (rotationEnd) {
        rotationStatus.innerHTML = '<span class="rotation-message">Rotation set!</span>';
        buildRotationPattern();
        renderCalendar();
    }
    


}

else if (rotationEnd === null) {
    let startParts = rotationStart.split("-");
    let clickedParts = dateKey.split("-");
    let startDateObject = new Date(
        startParts[0],
        startParts[1] - 1,
        startParts[2]
    );

    let clickedDateObject = new Date(
        clickedParts[0],
        clickedParts[1] - 1,
        clickedParts[2]
    );

    if (clickedDateObject < startDateObject) {


        rotationWarning.textContent = "Hmm, that end date seems to be before your start date. Please check your rotation and try again.";

        return;
    }

    rotationWarning.textContent = "";
    rotationEnd = dateKey;
    rotationStatus.innerHTML = '<span class="rotation-message">Rotation set!</span>';
    localStorage.setItem("rotationEnd", rotationEnd);
    dayBox.classList.add("rotation-boundary");
    buildRotationPattern();
    renderCalendar();
}
});

const mobileCloseDay = document.getElementById("mobile-close-day");

mobileCloseDay.addEventListener("click", function() {
    document.getElementById("mobile-day-view").style.display = "none";
});

const mobileAddEvent = document.getElementById("mobile-add-event");

mobileAddEvent.addEventListener("click", function() {
    selectedRecurringEvent = null;

    eventChooser.style.display = "none";
    eventInput.style.display = "block";
    eventRepeatSelect.parentElement.style.display = "block";
    saveEventButton.style.display = "inline-block";

    eventInput.value = "";
    eventNotes.value = "";
    eventRepeatSelect.value = "none";
    deleteEventButton.style.display = "none";

    document.getElementById("mobile-day-view").style.display = "none";
    eventPopup.style.display = "block";

    eventInput.focus();
});

const shiftButtons = document.createElement("div");
shiftButtons.classList.add("shiftButtons");
const shiftBar = document.createElement("div");
shiftBar.classList.add("shift-bar");

const currentShift = autoRotationV2
    ? getAutoRotationShiftV2(currentDate)
    : (shiftSelections[dateKey] || generatedShift);

if (currentShift === "D") {
    shiftBar.classList.add("day");
} else if (currentShift === "N") {
    shiftBar.classList.add("night");
}

if (currentShift === "D" || currentShift === "N") {
    dayBox.appendChild(shiftBar);
}

    const dayButton = document.createElement("button");
    dayButton.textContent = "D";
    dayButton.addEventListener("click", function(event) {
        event.stopPropagation();
    dayButton.classList.toggle("selected");
    if (dayButton.classList.contains("selected")) {
        shiftSelections[dateKey] = "D";
    } else {
        delete shiftSelections[dateKey];
    }
    localStorage.setItem("shiftSelections", JSON.stringify(shiftSelections));
    nightButton.classList.remove("selected");
    });

    const nightButton = document.createElement("button");
    nightButton.textContent = "N";
    nightButton.addEventListener("click", function() {
        event.stopPropagation();
        nightButton.classList.toggle("selected");
        if (nightButton.classList.contains("selected")) {
            shiftSelections[dateKey] = "N";
        } else {
            delete shiftSelections[dateKey];
        }
        localStorage.setItem("shiftSelections", JSON.stringify(shiftSelections));
        dayButton.classList.remove("selected");
    });

   // Version 2.0 — Keep shift buttons aligned with displayed shifts
if (currentShift === "D") {
    dayButton.classList.add("selected");
}

if (currentShift === "N") {
    nightButton.classList.add("selected");
}
    
    shiftButtons.appendChild(dayButton);
    shiftButtons.appendChild(nightButton);
dayBox.appendChild(shiftButtons);

    calendar.appendChild(dayBox);
}
const totalBoxes = startingPosition + daysInMonth;
const remainingBoxes = (7 - (totalBoxes %7)) %7;


for (let empty = 0; empty < remainingBoxes; empty++) {

    const emptyBox = document.createElement("div");
    calendar.appendChild(emptyBox);
}
}

workerName.addEventListener("change", function() {
    localStorage.setItem("workerName", workerName.value);
});

startDate.addEventListener("change", function() {
    localStorage.setItem("scheduleStart", startDate.value);

    calendar.innerHTML = "";


    const selectedDate = new Date(startDate.value + "T00:00:00");
    displayedDate = selectedDate;
    renderCalendar();
});

previousMonthButton.addEventListener("click", function() {

displayedDate.setMonth(displayedDate.getMonth() - 1);

renderCalendar();

});

    nextMonthButton.addEventListener("click", function() {

   displayedDate.setMonth(displayedDate.getMonth() + 1);

   renderCalendar();

});

if (rotationStart && rotationEnd) {
    rotationStatus.innerHTML = '<span class="rotation-message">Rotation set!</span>';
}

if (rotationStart || rotationEnd) {
    clearSelectionButton.style.display = "block";
}

clearSelectionButton.addEventListener("click", function() {
rotationStart = null;
rotationEnd = null;
rotationPattern = [];
localStorage.removeItem("rotationStart");
localStorage.removeItem("rotationEnd");
rotationWarning.textContent = "";
rotationStatus.textContent = "";
clearSelectionButton.style.display = "none";

renderCalendar();
});

todayButton.addEventListener("click", function() {
    displayedDate = new Date();
    renderCalendar();
});

cancelEventButtoin.addEventListener("click", function() {
    eventPopup.style.display = "none";
});
closeEventDetailsButton.addEventListener("click", function() {
    eventDetailsPopup.style.display = "none";
});
editEventDetailsButton.addEventListener("click", function() {
    
    if (!selectedDetailsEvent || !selectedDetailsDate) {
    return;
}

    eventDetailsPopup.style.display = "none";
    eventPopup.style.display = "block";

eventInput.style.display = "block";
eventRepeatSelect.parentElement.style.display = "block";
saveEventButton.style.display = "inline-block";
eventChooser.style.display = "none";
eventInput.value = selectedDetailsEvent.name;
eventNotes.value = selectedDetailsEvent.notes;
eventRepeatSelect.value = selectedDetailsRepeat;
selectedRecurringEvent = selectedDetailsEvent;
selectedEventDate =
    selectedDetailsDate.getFullYear() + "-" +
    (selectedDetailsDate.getMonth() + 1) + "-" +
    selectedDetailsDate.getDate();

selectedEventDay = selectedDetailsDate.getDay();
selectedEventDayOfMonth = selectedDetailsDate.getDate();
selectedEventMonth = selectedDetailsDate.getMonth();

eventPopupTitle.textContent = "Edit Event";
deleteEventButton.style.display = "inline-block";
});

eventInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveEventButton.click();
    }
});
saveEventButton.addEventListener("click", function() {
    const eventText = eventInput.value.trim();

    if (eventText === "" || selectedEventDate === null) {
        return;
    }
    const eventNoteText = eventNotes.value.trim();

const newEvent = {
    name: eventText,
    notes: eventNoteText
};

if (eventRepeatSelect.value === "weekly") {
    const dayOfWeek = selectedEventDay;

    if (!Array.isArray(recurringEvents[dayOfWeek])) {
    recurringEvents[dayOfWeek] = [];
}
console.log("Recurring events:", recurringEvents);

if (selectedRecurringEvent !== null) {
    const eventIndex = recurringEvents[dayOfWeek].indexOf(selectedRecurringEvent);

    if (eventIndex !== -1) {
        recurringEvents[dayOfWeek][eventIndex] = newEvent;
    }
} else {
    recurringEvents[dayOfWeek].push(newEvent);
}

    localStorage.setItem("recurringEvents", JSON.stringify(recurringEvents));
console.log("Recurring events:", recurringEvents);
} else if (eventRepeatSelect.value === "monthly") {
    const dayOfMonth = selectedEventDayOfMonth;

    if (!Array.isArray(monthlyEvents[dayOfMonth])) {
        monthlyEvents[dayOfMonth] = [];
    }

    if (selectedRecurringEvent !== null) {
const eventIndex = monthlyEvents[dayOfMonth].indexOf(selectedRecurringEvent);
if (eventIndex !== -1) {
monthlyEvents[dayOfMonth][eventIndex] = newEvent;
}
} else {
monthlyEvents[dayOfMonth].push(newEvent);
}

    localStorage.setItem("monthlyEvents", JSON.stringify(monthlyEvents));
    } else if (eventRepeatSelect.value === "yearly") {
        const yearlyKey = selectedEventMonth + "-" + selectedEventDayOfMonth;
        if (!Array.isArray(yearlyEvents[yearlyKey])) {
    yearlyEvents[yearlyKey] = [];
}

if (selectedRecurringEvent !== null) {
const eventIndex = yearlyEvents[yearlyKey].indexOf(selectedRecurringEvent);
if (eventIndex !== -1) {
yearlyEvents[yearlyKey][eventIndex] = newEvent;
}
} else {
yearlyEvents[yearlyKey].push(newEvent);
}
localStorage.setItem("yearlyEvents", JSON.stringify(yearlyEvents));
} else {
    personalEvents[selectedEventDate] = newEvent;

    localStorage.setItem("personalEvents", JSON.stringify(personalEvents));
}


    eventInput.value = "";
    eventPopup.style.display = "none";
    renderCalendar();
});

eventInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        saveEventButton.click();
    }
});

deleteEventButton.addEventListener("click", function() {
    if (selectedEventDate === null) {
        return;
    }


    if (eventRepeatSelect.value === "weekly") {
        recurringEvents[selectedEventDay] =
    recurringEvents[selectedEventDay].filter(function(eventText) {
        return eventText !== selectedRecurringEvent;
    });

if (recurringEvents[selectedEventDay].length === 0) {
    delete recurringEvents[selectedEventDay];
}

localStorage.setItem("recurringEvents", JSON.stringify(recurringEvents));
    } else if (eventRepeatSelect.value === "monthly") {
        monthlyEvents[selectedEventDayOfMonth] =
        monthlyEvents[selectedEventDayOfMonth].filter(function(eventText) {
            return eventText !== selectedRecurringEvent;
        });

    if (monthlyEvents[selectedEventDayOfMonth].length === 0) {
        delete monthlyEvents[selectedEventDayOfMonth];
    }

    localStorage.setItem("monthlyEvents", JSON.stringify(monthlyEvents));

} else if (eventRepeatSelect.value === "yearly") {
    const yearlyKey = selectedEventMonth + "-" + selectedEventDayOfMonth;
    yearlyEvents[yearlyKey] =
    yearlyEvents[yearlyKey].filter(function(eventText) {
        return eventText !== selectedRecurringEvent;
    });

    if (yearlyEvents[yearlyKey].length === 0) {
    delete yearlyEvents[yearlyKey];
}
localStorage.setItem("yearlyEvents", JSON.stringify(yearlyEvents));
} else {
    delete personalEvents[selectedEventDate];
    localStorage.setItem("personalEvents", JSON.stringify(personalEvents));
}

    eventInput.value = "";
    eventRepeatSelect.value = "none";
    eventPopup.style.display = "none";

    renderCalendar();
});

// VERSION 2.0 — Add Event button
const dayViewAddButton = document.getElementById("day-view-add");
dayViewAddButton.addEventListener("click", function() {
    const selectedDayBox = document.querySelector(
        '#calendar .calendar-cell[data-day-view-selected="true"]'
    );

    if (selectedDayBox) {
        document.getElementById("day-view-v2").style.display = "none";

        resetEventPopup();

const selectedDateText = document.getElementById("day-view-title").dataset.date;
const [year, month, day] = selectedDateText.split("-").map(Number);
const selectedDate = new Date(year, month - 1, day);

selectedEventDate =
    selectedDate.getFullYear() + "-" +
    (selectedDate.getMonth() + 1) + "-" +
    selectedDate.getDate();
selectedEventDay = selectedDate.getDay();

selectedEventDayOfMonth = Number(selectedEventDate.split("-")[2]);
selectedEventMonth = Number(selectedEventDate.split("-")[1]) - 1;

eventPopupTitle.textContent = "Add to " + selectedDate.toDateString();

eventPopup.style.display = "block";
eventInput.focus();
    }
});
// VERSION 2.0 — Open Rotation Setup
const setupRotationButton = document.getElementById("setup-rotation-v2");

setupRotationButton.addEventListener("click", function() {
    document.getElementById("rotation-setup-v2").style.display = "block";
});
// VERSION 2.0 — Close Rotation Setup
const rotationSetupCloseButton = document.getElementById("rotation-setup-close");

rotationSetupCloseButton.addEventListener("click", function() {
    document.getElementById("rotation-setup-v2").style.display = "none";
});
// Version 2.0 — Apply Rotation button
const applyRotationButtonV2 = document.getElementById("apply-rotation-v2");

applyRotationButtonV2.addEventListener("click", function() {
    const schedule = document.getElementById("rotation-schedule-v2").value;
const shift = document.getElementById("rotation-shift-v2").value;
const startDate = document.getElementById("rotation-start-v2").value;

console.log("Schedule:", schedule);
console.log("Shift:", shift);
console.log("Start Date:", startDate);
// Version 2.0 — Save automatic rotation settings
if (!schedule || !shift || !startDate) {
    alert("Please choose a schedule, shift, and start date.");
    return;
}
// Version 2.0 — Validate custom rotation
if (schedule === "custom") {
    const daysOn = Number(document.getElementById("rotation-days-on-v2").value);
    const daysOff = Number(document.getElementById("rotation-days-off-v2").value);

    if (!Number.isInteger(daysOn) || !Number.isInteger(daysOff) ||
        daysOn < 1 || daysOff < 1 || daysOn > 31 || daysOff > 31) {
        alert("Please enter valid work days and days off (1–31 each).");
        return;
    }
}
// Version 2.0 — Require a starting shift for alternating rotations
if (shift === "AlternatingBlocks" || shift === "Alternating2Weeks") {
    const firstShift = document.getElementById("rotation-first-shift-v2").value;

    if (!firstShift) {
        alert("Please choose whether your rotation starts on Days or Nights.");
        return;
    }
}
autoRotationV2 = {
    schedule: schedule,
    shift: shift,
    startDate: startDate,
    firstShift: (
    shift === "AlternatingBlocks" ||
    shift === "Alternating2Weeks"
)
    ? document.getElementById("rotation-first-shift-v2").value
    : shift,
    daysOn: schedule === "custom"
        ? Number(document.getElementById("rotation-days-on-v2").value)
        : null,
    daysOff: schedule === "custom"
        ? Number(document.getElementById("rotation-days-off-v2").value)
        : null
};

localStorage.setItem("autoRotationV2", JSON.stringify(autoRotationV2));
// Version 2.0 — Refresh calendar after applying rotation
renderCalendar();
document.getElementById("rotation-setup-v2").style.display = "none";
});
// Version 2.0 — Show starting shift for alternating rotations
const rotationShiftSelectV2 = document.getElementById("rotation-shift-v2");
const rotationFirstShiftFieldsV2 = document.getElementById("rotation-first-shift-fields-v2");

rotationShiftSelectV2.addEventListener("change", function() {
    const isAlternating =
        this.value === "AlternatingBlocks" ||
        this.value === "Alternating2Weeks";

    rotationFirstShiftFieldsV2.style.display =
        isAlternating ? "block" : "none";
});
// VERSION 2.0 — Show Custom Schedule fields
const rotationScheduleSelect = document.getElementById("rotation-schedule-v2");
const rotationCustomFields = document.getElementById("rotation-custom-fields-v2");

rotationScheduleSelect.addEventListener("change", function() {
    rotationCustomFields.style.display =
        this.value === "custom" ? "block" : "none";
});
// VERSION 2.0 — Close Day View
const dayViewCloseButton = document.getElementById("day-view-close");

dayViewCloseButton.addEventListener("click", function() {
    document.getElementById("day-view-v2").style.display = "none";
});
renderCalendar();