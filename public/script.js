document.addEventListener("DOMContentLoaded", function () {
    const agreeBox = document.getElementById("agreeBox");
    const mainContent = document.getElementById("mainContent");
    const agreeCheckbox = document.getElementById("agreeCheckbox");
    const continueBtn = document.getElementById("continueBtn");
    const resultPopup = document.getElementById("resultPopup");
    const resultMessage = document.getElementById("resultMessage");
    const balanceAmount = document.getElementById("balanceAmount");
    const totalDepositA = document.getElementById("totalDepositA");
    const totalDepositB = document.getElementById("totalDepositB");
    const selectionPopup = document.getElementById("selectionPopup");
    const confirmSelectionBtn = document.getElementById("confirmSelection");
    const cancelSelectionBtn = document.getElementById("cancelSelection");
    let selectedOption = "";

    // Reset balance on page refresh
    localStorage.removeItem("balance");
    if (balanceAmount) balanceAmount.innerText = "0";

    // Handle Agreement Checkbox
    continueBtn.addEventListener("click", function () {
        if (agreeCheckbox.checked) {
            agreeBox.style.display = "none";
            mainContent.style.display = "block";
        } else {
            alert("You must agree to the terms before continuing.");
        }
    });

    function fetchTotalDeposits() {
        fetch("https://yakle-backend1.onrender.com/total-deposits")
            .then(response => response.json())
            .then(data => {
                if (totalDepositA) totalDepositA.innerText = data.totalA;
                if (totalDepositB) totalDepositB.innerText = data.totalB;
            })
            .catch(err => console.error("Failed to fetch total deposits:", err));
    }

    fetchTotalDeposits();
    setInterval(fetchTotalDeposits, 5000);

    function showResultPopup() {
        let currentTime = new Date();
        let ISTTime = new Date(currentTime.getTime() + (5.5 * 60 * 60 * 1000));
        let hours = ISTTime.getUTCHours();

        if (hours >= 20 && hours <= 23) {
            fetch("https://yakle-backend1.onrender.com/total-deposits")
                .then(response => response.json())
                .then(data => {
                    let winner = data.totalA < data.totalB ? "A" : "B";
                    resultMessage.innerText = `🎉 ${winner} Wins. Winning amount deposited to your account. Next game starts from 12:00 AM.`;
                    resultPopup.style.display = "block";
                })
                .catch(err => {
                    console.error("Error fetching result data:", err);
                    resultMessage.innerText = "⚠️ Error fetching results. Try again later.";
                    resultPopup.style.display = "block";
                });
        }
    }

    setTimeout(showResultPopup, 5000);

    const depositPopup = document.getElementById("depositPopup");
    const withdrawPopup = document.getElementById("withdrawPopup");
    const phonePopup = document.getElementById("phonePopup");
    const namePopup = document.getElementById("namePopup");
    const upiPopup = document.getElementById("upiSection");
    const upiLink = document.getElementById("openUPILink");
    let upiTimer;

    function showPhonePopup(action) {
        phonePopup.style.display = "block";
        document.getElementById("continuePhone").onclick = function () {
            let phoneNumber = document.getElementById("phoneNumber").value;
            if (/^\d{10}$/.test(phoneNumber)) {
                phonePopup.style.display = "none";
                action === "deposit" ? depositPopup.style.display = "block" : withdrawPopup.style.display = "block";
                localStorage.setItem("phoneNumber", phoneNumber);
            } else {
                showPopup("❌ Please enter a valid 10-digit phone number.");
            }
        };
    }

    document.querySelectorAll(".deposit-btn").forEach(button => button.addEventListener("click", () => showPhonePopup("deposit")));
    document.querySelectorAll(".withdraw-btn").forEach(button => button.addEventListener("click", () => showPhonePopup("withdraw")));

    document.getElementById("confirmDeposit").addEventListener("click", function () {
        let amount = parseInt(document.getElementById("depositAmount").value);
        if (amount >= 10 && amount <= 500) {
            localStorage.setItem("lastDepositAmount", amount);
            depositPopup.style.display = "none";
            namePopup.style.display = "block";
        } else {
            showPopup("⚠️ Please enter a valid amount (₹10 - ₹500).");
        }
    });

    document.getElementById("confirmName").addEventListener("click", function () {
        let userName = document.getElementById("userName").value.trim();
        let amount = parseInt(localStorage.getItem("lastDepositAmount"));

        if (userName !== "" && amount >= 10 && amount <= 500) {
            namePopup.style.display = "none";
            upiPopup.style.display = "block";
            localStorage.setItem("userName", userName);

            let upiPaymentLink = `intent://pay?pa=7449113378@mbk&pn=Yakle&am=${amount}&cu=INR#Intent;scheme=upi;end;`;
            upiLink.setAttribute("href", upiPaymentLink);
            upiLink.addEventListener("click", () => {
                clearInterval(upiTimer);
                startUPITimer(amount);
            }, { once: true });
        } else {
            showPopup("⚠️ Enter a valid name and deposit amount.");
        }
    });

    function startUPITimer(amount) {
        let timeLeft = 60;
        document.getElementById("timerDisplay").style.display = "block";
        upiTimer = setInterval(() => {
            document.getElementById("timerDisplay").innerText = `Please Wait⌛ Time left: ${timeLeft}s`;
            if (timeLeft-- <= 0) {
                clearInterval(upiTimer);
                upiPopup.style.display = "none";
                updateBalance(amount);
            }
        }, 1000);
    }

    function updateBalance(amount) {
        let balance = parseInt(localStorage.getItem("balance")) || 0;
        balance += amount;
        balanceAmount.innerText = balance;
        localStorage.setItem("balance", balance);
        showPopup("✅ Payment Successful! Balance updated.");
    }

    document.getElementById("btnA").addEventListener("click", () => openSelectionPopup("A"));
    document.getElementById("btnB").addEventListener("click", () => openSelectionPopup("B"));

    function openSelectionPopup(option) {
        selectedOption = option;
        selectionPopup.style.display = "block";
    }

    cancelSelectionBtn.addEventListener("click", function () {
        selectionPopup.style.display = "none";
    });

    confirmSelectionBtn.addEventListener("click", function () {
        selectionPopup.style.display = "none";
        handleSelection(selectedOption);
    });

    function handleSelection(option) {
        let lastDepositAmount = parseInt(localStorage.getItem("lastDepositAmount")) || 0;
        let currentBalance = parseInt(localStorage.getItem("balance")) || 0;

        if (currentBalance >= lastDepositAmount) {
            let newBalance = currentBalance - lastDepositAmount;
            balanceAmount.innerText = newBalance;
            localStorage.setItem("balance", newBalance);

            fetch('https://yakle-backend1.onrender.com/save-selection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: localStorage.getItem("phoneNumber"),
                    name: localStorage.getItem("userName"),
                    time: new Date().toISOString(),
                    depositAmount: lastDepositAmount,
                    choice: option,
                    type: "selection"
                })
            }).then(response => response.json()).then(data => {
                showPopup(data.success ? "✅ Choice Confirmed. Wait For the Results at 8.00pm" : "⚠️ Error saving selection. Try again.");
            }).catch(() => showPopup("⚠️ Network error! Try again."));
        } else {
            showPopup("❌ Insufficient balance! Please deposit first.");
        }
    }

    function showPopup(message) {
        alert(message);
    }
});
// Money Rain Effect
function createMoneyRain() {
    const money = document.createElement("div");
    money.classList.add("money");
    money.innerHTML = '<img src="money.png" alt="money" width="50px">';
    document.body.appendChild(money);
    money.style.left = Math.random() * window.innerWidth + "px";
    setTimeout(() => money.remove(), 3000);
}

setInterval(createMoneyRain, 500);
