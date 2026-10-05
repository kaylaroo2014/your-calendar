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

dayBox.addEventListener("click", function() {
    
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

const shiftButtons = document.createElement("div");
shiftButtons.classList.add("shiftButtons");

    const dayButton = document.createElement("button");
    dayButton.textContent = "D";
    dayButton.addEventListener("click", function() {
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

    if (shiftSelections[dateKey] === "D") {
        dayButton.classList.add("selected")
    }
     
    if (shiftSelections[dateKey] ==="N") {
        nightButton.classList.add("selected");
    }

    if (generatedShift === "D") {
        dayButton.classList.add("selected");
    }

    if (generatedShift === "N") {
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

renderCalendar();
