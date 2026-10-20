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



/* =========================================
   FINANCE 2.0 — RECEIPTS & DAY VIEW
   ========================================= */

const billDayPopup = document.getElementById("bill-day-popup");
const billDayTitle = document.getElementById("bill-day-title");
const billDayList = document.getElementById("bill-day-list");
const billDayAdd = document.getElementById("bill-day-add");
const billDayClose = document.getElementById("bill-day-close");

let viewingBillDate = null;

// Check whether a bill occurs on a particular date.
function billOccursOnDate(bill, date) {
    const [billYear, billMonth, billDay] =
        bill.date.split("-").map(Number);

    const originalDate = new Date(
        billYear,
        billMonth - 1,
        billDay
    );

    const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    if (checkDate < originalDate) return false;

    const year = checkDate.getFullYear();
    const month = checkDate.getMonth();
    const day = checkDate.getDate();

    if (bill.repeat === "never") {
        return bill.date === formatBillDate(checkDate);
    }

    if (bill.repeat === "weekly") {
        const daysBetween = Math.round(
            (
                Date.UTC(year, month, day) -
                Date.UTC(billYear, billMonth - 1, billDay)
            ) / 86400000
        );

        return daysBetween % 7 === 0;
    }

    if (bill.repeat === "monthly") {
        const lastDay = new Date(
            year,
            month + 1,
            0
        ).getDate();

        return day === Math.min(billDay, lastDay);
    }

    if (bill.repeat === "yearly") {
        return (
            month === billMonth - 1 &&
            day === billDay
        );
    }

    return false;
}

function getBillsForDate(date) {
    return bills.filter(bill =>
        billOccursOnDate(bill, date)
    );
}

// Small receipt SVG, using the CSS color.
function createReceiptIcon(isPaid) {
    const receipt = document.createElement("span");

    receipt.className =
        "bill-receipt " + (isPaid ? "paid" : "unpaid");

    receipt.innerHTML = `
        <svg viewBox="0 0 24 24"
             width="19"
             height="19"
             fill="none"
             stroke="currentColor"
             stroke-width="1.8"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true">
            <path d="M4 3v18l4-2 4 2 4-2 4 2V3H4z"/>
            <path d="M8 8h8M8 12h8M8 16h4"/>
        </svg>
    `;

    return receipt;
}

// Display all bills for the selected date.
function openBillDayView(date) {
    viewingBillDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    billDayTitle.textContent =
        "Bills — " +
        viewingBillDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    billDayList.innerHTML = "";

    const dayBills = getBillsForDate(viewingBillDate);

    if (dayBills.length === 0) {
        const empty = document.createElement("p");
        empty.className = "bill-day-empty";
        empty.textContent = "No bills for this date.";
        billDayList.appendChild(empty);
    }

    dayBills.forEach(bill => {
        const isPaid = paidBills[
            getPaymentKey(bill, viewingBillDate)
        ] === true;

        const entry = document.createElement("button");
        entry.type = "button";
        entry.className = "bill-day-entry";

        const icon = createReceiptIcon(isPaid);

        const info = document.createElement("span");
        info.className = "bill-day-info";

        const name = document.createElement("strong");
        name.textContent = bill.name;

        const status = document.createElement("small");
        status.textContent = isPaid ? "Paid" : "Unpaid";
        status.className = isPaid
            ? "bill-status-paid"
            : "bill-status-unpaid";

        info.appendChild(name);
        info.appendChild(status);

        const amount = document.createElement("span");
        amount.className = "bill-day-amount";

        amount.textContent =
            bill.amount !== undefined &&
            bill.amount !== ""
                ? "$" + Number(bill.amount).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )
                : "—";

        entry.appendChild(icon);
        entry.appendChild(info);
        entry.appendChild(amount);

        entry.addEventListener("click", () => {
            billDayPopup.style.display = "none";
            openBillDetails(bill, viewingBillDate);
        });

        billDayList.appendChild(entry);
    });

    billDayPopup.style.display = "flex";
}

billDayAdd.addEventListener("click", () => {
    if (!viewingBillDate) return;

    billDayPopup.style.display = "none";
    openBillPopup(viewingBillDate);
});

billDayClose.addEventListener("click", () => {
    billDayPopup.style.display = "none";
});

/* =========================================
   COMPACT CALENDAR
   ========================================= */

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.textContent = currentDate.toLocaleString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    // Blank cells before the first date.
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        calendarGrid.appendChild(emptyCell);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);

        const dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");

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

        const dayBills = getBillsForDate(date);

        if (dayBills.length > 0) {
            const receipts = document.createElement("div");
            receipts.className = "bill-receipts";

            // Show up to three receipts.
            dayBills.slice(0, 3).forEach(bill => {
                const isPaid = paidBills[
                    getPaymentKey(bill, date)
                ] === true;

                receipts.appendChild(
                    createReceiptIcon(isPaid)
                );
            });

            // Additional bills are represented by a count.
            if (dayBills.length > 3) {
                const extra = document.createElement("span");
                extra.className = "bill-receipt-extra";
                extra.textContent = "+" + (dayBills.length - 3);
                receipts.appendChild(extra);
            }

            dayCell.appendChild(receipts);
            dayCell.classList.add("has-bills");
        }

        dayCell.addEventListener("click", () => {
            if (dayBills.length > 0) {
                openBillDayView(date);
            } else {
                openBillPopup(date);
            }
        });

        calendarGrid.appendChild(dayCell);
    }
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