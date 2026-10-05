
// FINANCE JR. — Calendar

let currentDate = new Date();

const monthYear = document.getElementById("month-year");
const calendarGrid = document.getElementById("calendar-grid");

const prevMonth = document.getElementById("prev-month");
const nextMonth = document.getElementById("next-month");


// Bill popup elements
const billPopup = document.getElementById("bill-popup");
const popupDate = document.getElementById("popup-date");
const billName = document.getElementById("bill-name");
const billAmount = document.getElementById("bill-amount");
const billDate = document.getElementById("bill-date");
const billNotes = document.getElementById("bill-notes");
const billRepeat = document.getElementById("bill-repeat");
const cancelBill = document.getElementById("cancel-bill");
const upcomingBillsList = document.getElementById("upcoming-bills-list");


// Finance Jr.'s saved bills
let bills = JSON.parse(localStorage.getItem("financeBills")) || [];

function saveBills() {
    localStorage.setItem("financeBills", JSON.stringify(bills));
}


let selectedBillDate = null;
let editingBillId = null;

// Track which bill occurrence is currently open
let selectedBill = null;
let selectedOccurrenceDate = null;

// Paid status is saved separately for each occurrence
let paidBills = JSON.parse(localStorage.getItem("financePaidBills")) || {};

function savePaidBills() {
    localStorage.setItem("financePaidBills", JSON.stringify(paidBills));
}

// Create a unique key for each bill occurrence
function getPaymentKey(bill, date) {
    const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");

    return bill.id + "_" + dateKey;
}


function formatBillDate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


function openBillPopup(date) {
    selectedBillDate = date;
    billDate.value = formatBillDate(date);
    editingBillId = null;

    popupDate.textContent = "Add Bill — " +
        date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    billName.value = "";
    billAmount.value = "";
    billNotes.value = "";
    billRepeat.value = "never";

    billPopup.style.display = "flex";
    billName.focus();
}

// Close popup
cancelBill.addEventListener("click", () => {
    billPopup.style.display = "none";
});

function editBill(bill) {
    editingBillId = bill.id;

    // Load the bill's original date
    const [year, month, day] = bill.date.split("-").map(Number);
    selectedBillDate = new Date(year, month - 1, day);

    // Fill the form with the existing information
    popupDate.textContent = "Edit Bill";

    billName.value = bill.name;
    billDate.value = bill.date;
billAmount.value = bill.amount ?? "";
billNotes.value = bill.notes ?? "";
billRepeat.value = bill.repeat;

    // Close details and open the editor
    billDetailsPopup.style.display = "none";
    billPopup.style.display = "flex";

    billName.focus();
}



// Save a new bill

document.getElementById("save-bill").addEventListener("click", () => {

    const name = billName.value.trim();
    const amount = billAmount.value;
const notes = billNotes.value.trim();
const dueDate = billDate.value;

if (!dueDate) return;

    if (!name || !selectedBillDate) return;

    if (editingBillId !== null) {

        // EDIT an existing bill
        const bill = bills.find(bill => bill.id === editingBillId);

        if (bill) {
    bill.name = name;
    bill.amount = amount;
    bill.notes = notes;
    bill.date = dueDate;
    bill.repeat = billRepeat.value;
}

    } else {

        // CREATE a new bill
        
const newBill = {
    id: Date.now(),
    name: name,
    amount: amount,
    notes: notes,
    date: dueDate,
    repeat: billRepeat.value,
    paid: false
};


        bills.push(newBill);
    }

    saveBills();

    editingBillId = null;

    billPopup.style.display = "none";

    renderCalendar();
});



// Bill details popup elements
const billDetailsPopup = document.getElementById("bill-details-popup");
const detailsBillName = document.getElementById("details-bill-name");
const detailsBillDate = document.getElementById("details-bill-date");
const detailsBillRepeat = document.getElementById("details-bill-repeat");
const detailsBillAmount = document.getElementById("details-bill-amount");
const detailsBillNotes = document.getElementById("details-bill-notes");
const detailsNotesSection = document.getElementById("details-notes-section");


function openBillDetails(bill, occurrenceDate) {
    selectedBill = bill;
    selectedOccurrenceDate = occurrenceDate;

    detailsBillName.textContent = bill.name;

    detailsBillDate.textContent = "Due: " +
        occurrenceDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    detailsBillRepeat.textContent = "Repeats: " + bill.repeat;

// Display the bill amount
detailsBillAmount.textContent = bill.amount !== undefined && bill.amount !== ""
    ? `Amount: $${Number(bill.amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`
    : "Amount: Not specified";

// Display additional details
detailsBillNotes.textContent = bill.notes || "";

detailsNotesSection.style.display = bill.notes ? "block" : "none";


    // Check whether THIS occurrence has been paid
    const paymentKey = getPaymentKey(bill, occurrenceDate);
    const isPaid = paidBills[paymentKey] === true;

    const paidButton = document.getElementById("details-paid");

    paidButton.textContent = isPaid ? "Mark Unpaid" : "Mark Paid";

    billDetailsPopup.style.display = "flex";
}


// Close details popup
document.getElementById("details-close").addEventListener("click", () => {
    billDetailsPopup.style.display = "none";
});
document.getElementById("details-edit").addEventListener("click", () => {
    if (!selectedBill) return;

    editBill(selectedBill);
});

// Delete an entire bill (including recurring occurrences)

// Finance Jr. — Custom Delete Confirmation

const deleteConfirmPopup = document.getElementById("delete-confirm-popup");
const deleteConfirmMessage = document.getElementById("delete-confirm-message");

// Open our custom confirmation popup
document.getElementById("details-delete").addEventListener("click", () => {

    if (!selectedBill) return;

    deleteConfirmMessage.textContent =
        `Are you sure you want to delete "${selectedBill.name}"?`;

    billDetailsPopup.style.display = "none";
    deleteConfirmPopup.style.display = "flex";
});

// Cancel deletion — return to Bill Details
document.getElementById("cancel-delete").addEventListener("click", () => {

    deleteConfirmPopup.style.display = "none";
    billDetailsPopup.style.display = "flex";
});

// Confirm deletion
document.getElementById("confirm-delete").addEventListener("click", () => {

    if (!selectedBill) return;

    const deletedBillId = selectedBill.id;

    // Remove the entire bill series
    bills = bills.filter(bill => bill.id !== deletedBillId);

    // Remove its saved payment history
    Object.keys(paidBills).forEach(key => {
        if (key.startsWith(deletedBillId + "_")) {
            delete paidBills[key];
        }
    });

    saveBills();
    savePaidBills();

    selectedBill = null;
    selectedOccurrenceDate = null;

    deleteConfirmPopup.style.display = "none";

    renderCalendar();
});




// Mark a specific bill occurrence paid or unpaid
document.getElementById("details-paid").addEventListener("click", () => {
    if (!selectedBill || !selectedOccurrenceDate) return;

    const paymentKey = getPaymentKey(
        selectedBill,
        selectedOccurrenceDate
    );

    // Toggle payment status for this occurrence only
    paidBills[paymentKey] = !paidBills[paymentKey];

    savePaidBills();

    billDetailsPopup.style.display = "none";

    renderCalendar();
});


function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Display the current month and year
    monthYear.textContent = currentDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric"
    });

    // Find where the first day of the month falls
    const firstDay = new Date(year, month, 1).getDay();

    // Find how many days are in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        calendarGrid.appendChild(emptyCell);
    }

    // Generate each date
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");

        dayCell.classList.add("calendar-day");

const today = new Date();

const dayNumber = document.createElement("span");
dayNumber.textContent = day;

if (
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()
) {
    dayNumber.classList.add("today-number");
}

dayCell.appendChild(dayNumber);

// Display bills for this date
const dateKey = [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0")
].join("-");


const billsForDay = bills.filter(bill => {
    const [billYear, billMonth, billDay] = bill.date
        .split("-")
        .map(Number);

    const originalDate = new Date(billYear, billMonth - 1, billDay);
    const currentCellDate = new Date(year, month, day);

    // Never show a recurring bill before its original start date
    if (currentCellDate < originalDate) {
        return false;
    }

    if (bill.repeat === "never") {
        return bill.date === dateKey;
    }

    if (bill.repeat === "weekly") {
        const daysBetween = Math.round(
            (Date.UTC(year, month, day) -
             Date.UTC(billYear, billMonth - 1, billDay)) / 86400000
        );

        return daysBetween % 7 === 0;
    }

    if (bill.repeat === "monthly") {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const dueDay = Math.min(billDay, lastDayOfMonth);

    return day === dueDay;
}

    if (bill.repeat === "yearly") {
        return month === billMonth - 1 && day === billDay;
    }

    return false;
});


billsForDay.forEach(bill => {
    const billLabel = document.createElement("div");

    billLabel.classList.add("bill-label");
    billLabel.textContent = bill.name;

// Check whether this specific occurrence is paid
const occurrenceDate = new Date(year, month, day);
const paymentKey = getPaymentKey(bill, occurrenceDate);

if (paidBills[paymentKey] === true) {
    billLabel.classList.add("paid");
    billLabel.textContent = "✓ " + bill.name;
}


billLabel.addEventListener("click", (event) => {
    event.stopPropagation();

    const occurrenceDate = new Date(year, month, day);

    openBillDetails(bill, occurrenceDate);
});


    dayCell.appendChild(billLabel);
});

dayCell.addEventListener("click", () => {
    const selectedDate = new Date(year, month, day);
    openBillPopup(selectedDate);
});
calendarGrid.appendChild(dayCell);
    }
    renderUpcomingBills();
}

// Previous month
prevMonth.addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

// Next month
nextMonth.addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Return to the current month
document.getElementById("today-button").addEventListener("click", () => {
    currentDate = new Date();
    renderCalendar();
});
function renderUpcomingBills() {

    upcomingBillsList.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];

    // Look ahead 90 days
    for (let i = 0; i <= 90; i++) {

        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        const year = checkDate.getFullYear();
        const month = checkDate.getMonth();
        const day = checkDate.getDate();

        bills.forEach(bill => {

            const [billYear, billMonth, billDay] =
                bill.date.split("-").map(Number);

            const originalDate =
                new Date(billYear, billMonth - 1, billDay);

            // Don't show occurrences before the bill originally begins
            if (checkDate < originalDate) return;

            let occursToday = false;

            if (bill.repeat === "never") {
                occursToday =
                    year === billYear &&
                    month === billMonth - 1 &&
                    day === billDay;
            }

            if (bill.repeat === "weekly") {

                const daysBetween = Math.round(
                    (
                        Date.UTC(year, month, day) -
                        Date.UTC(billYear, billMonth - 1, billDay)
                    ) / 86400000
                );

                occursToday = daysBetween % 7 === 0;
            }

            if (bill.repeat === "monthly") {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const dueDay = Math.min(billDay, lastDayOfMonth);

    occursToday = day === dueDay;
}

            if (bill.repeat === "yearly") {
                occursToday =
                    month === billMonth - 1 &&
                    day === billDay;
            }

            if (!occursToday) return;

            // Skip occurrences that are already paid
            const paymentKey = getPaymentKey(bill, checkDate);

            if (paidBills[paymentKey] === true) return;

            upcoming.push({
                bill: bill,
                date: new Date(checkDate)
            });
        });
    }

    // Only show the nearest 5 unpaid occurrences
    const nextBills = upcoming.slice(0, 5);

    if (nextBills.length === 0) {
        upcomingBillsList.innerHTML =
            `<p class="upcoming-empty">No upcoming bills.</p>`;
        return;
    }

    nextBills.forEach(item => {

        const entry = document.createElement("div");
        entry.classList.add("upcoming-item");
        entry.addEventListener("click", () => {
    openBillDetails(item.bill, item.date);
});

        const date = document.createElement("div");
        date.classList.add("upcoming-date");

        date.textContent = item.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        const name = document.createElement("div");
        name.classList.add("upcoming-name");
        name.textContent = item.bill.name;

        entry.appendChild(date);
        entry.appendChild(name);

        upcomingBillsList.appendChild(entry);
    });
}
// Load the calendar
renderCalendar();
// Jump to a selected month
document.getElementById("jump-button").addEventListener("click", () => {
    const dateValue = document.getElementById("jump-date").value;

    if (!dateValue) return;

    const [year, month] = dateValue.split("-").map(Number);

    currentDate = new Date(year, month - 1, 1);

    renderCalendar();
});