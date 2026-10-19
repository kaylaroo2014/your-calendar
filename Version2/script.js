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

        selectedDayBox.dispatchEvent(new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true
        }));
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