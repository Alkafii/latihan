import express from "express";
import bodyParser from "body-parser";
import session from "express-session";

const app = express();
const port = 3000;

const name = "Muhammad Ghossan Alkafi";
const accountNo = 993104912;
const myUsername = "admin";
const myPassword = "admin";
let methodOfTransfer = ""; 
let balance = 1000000;
let depositeArray = [];
let withdrawArray = [];
let tfArray = [];

let accountName = "";
let transferFee = "";
let lastBankName = "";
let lastAccountNo = "";
let lastAccountName = "";
let lastTransferAmount = "";
let lastBalance = "";
let errorMessage = "";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "Kucing-goreng48",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 }
}));

function loginAccess(req, res, next) {
  if (req.session && req.session.haveBeenLogin === true) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

app.get("/", loginAccess, function(req, res) {
  let data = {
    dashboardDepo: depositeArray.length,
    dashboardAmount: (dashboardDepo()).toLocaleString("en-US"),
    dashboardWith: withdrawArray.length,
    dashboardWithAmount: (dashboardWith()).toLocaleString("en-US"),
    dashboardTf: tfArray.length,
    dashboardTfAmount: (dashboardTf()).toLocaleString("en-US"),
    name: name,
    accountNo: accountNo,
    totalDeposit: (balance).toLocaleString("en-US"),
    errorMessage: ""
  };
  res.render("index.ejs", data);
});

app.get("/login", function(req, res) {
    res.render("login.ejs", { 
      errorMessage: "",
      type: "password",
      usernameValue: "",
      passwordValue: ""
  });
});

app.post("/submitLogin", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const action = req.body.loginAction;
  const currentType = req.body.currentType || "password"; 

  if(action === "Login") {
    if(username === myUsername && password === myPassword) {
        req.session.haveBeenLogin = true;
        res.redirect("/");
    } else {
        res.render("login.ejs", { 
          type: "password",
          errorMessage: "Username atau Password salah!",
          usernameValue: username || "",
          passwordValue: password || ""
        });
    }
  }   else if(action === "👁") {
      let nextType = "password";
        if (currentType === "password") {
          nextType = "text";
        } else {
          nextType = "password";
        }
      const data = {
        type: nextType,
        errorMessage: "",
        usernameValue: username || "",
        passwordValue: password || ""
      };
  res.render("login.ejs", data); 
  }
});

app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    res.redirect("/login");
  });
});

app.get("/deposit", loginAccess, function(req, res) {
  let data = {
    depositAmount: "",
    totalDeposit: (balance).toLocaleString("en-US"),
    historyDepo: historyDepo()
  };
  res.render("deposit.ejs", data);
});

app.post("/submitDeposit", function(req, res) {
  const depositAmount = Number(req.body.depositAmount) || 0;
  depositeArray.push(depositAmount);
  balance = balance + depositAmount;

  let data = {
    depositAmount: depositAmount,
    totalDeposit: (balance).toLocaleString("en-US"),
    historyDepo: historyDepo()
  };
  res.render("deposit.ejs", data);
});

  function historyDepo() {
  let listNo = "";
  for(let i = 0; i < depositeArray.length; i++) {
      listNo = listNo + `<li>Deposit Ke-${i + 1}: Rp${(depositeArray[i]).toLocaleString("en-US")}</li>`;
  }
  return listNo;
}

  function dashboardDepo() {
    let total = 0;
    for(let i = 0; i < depositeArray.length; i++) {
      total = total + depositeArray[i];
    }
    return total;
  }

app.get("/withdraw", loginAccess, function(req, res) {
  let data = {
    errorMessage: "",
    withdrawAmount: "",
    totalwithdraw: (balance).toLocaleString("en-US"),
    historywithdraw: historywithdraw()
  };
  res.render("withdraw.ejs", data);
});

app.post("/submitWithdraw", function(req, res) {
  const withdrawAmount = Number(req.body.withdrawAmount) || 0;

  if(withdrawAmount > balance){
    errorMessage = "Anda tidak bisa withdraw melebih saldo anda";
  } else if(withdrawAmount < balance){
    withdrawArray.push(withdrawAmount);
    balance = balance - withdrawAmount;
  }

  let data = {
    errorMessage: errorMessage,
    withdrawAmount: withdrawAmount,
    totalwithdraw: (balance).toLocaleString("en-US"),
    historywithdraw: historywithdraw()
  };
  res.render("withdraw.ejs", data);
});

  function historywithdraw() {
    let listNo = "";
    for(let i = 0; i < withdrawArray.length; i++) {
        listNo = listNo + `<li>Withdraw Ke-${i + 1}: Rp${(withdrawArray[i].toLocaleString("en-US"))}</li>`;
    }
    return listNo;
  }

  function dashboardWith() {
    let total = 0;
    for(let i = 0; i < withdrawArray.length; i++) {
      total = total + withdrawArray[i];
    }
    return total;
  }

app.get("/transfer", loginAccess, function(req, res) {
  let data = {
    errorMessage: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    transferAmount: "",
    totalAmount: (balance).toLocaleString("en-US"),
    historyTf: historyTf("")
  };
  res.render("transfer.ejs", data);
});

app.post("/submitTransfer", function(req, res) {
  const nameOfBank = req.body.bankName;
  const accountNo = req.body.accountNum;
  const action = req.body.submitAction;
  methodOfTransfer = req.body.transferMethod; 
  let transferAmount = Number(req.body.transferAmount) || "";

    if(transferAmount > balance){
    errorMessage = "Anda tidak bisa transfer melebih saldo anda";
  } else if(transferAmount < balance){
      if(action === "Inquiry") {
      } else if(action === "Transfer") {
        tfArray.push(transferAmount);
        balance = (balance - transferAmount) - feeBased(lastBankName);
      }
  }

  let data = {
    errorMessage: errorMessage,
    bankName: nameOfBank,
    accountNumber: accountNo,
    accountName: accName(accountNo), 
    transferAmount: transferAmount,
    totalAmount: (balance).toLocaleString("en-US"),
    historyTf: historyTf(accountNo)
  };

  lastBankName = data.bankName;
  lastAccountNo = data.accountNumber;
  lastAccountName = data.accountName;
  lastTransferAmount = data.transferAmount;
  lastBalance = data.totalAmount;

  res.render("transfer.ejs", data);
});
    
  function accName(accountNo) {
    if(accountNo == 101010) {
      accountName = "Muhammad Ghossan Alkafi";
    } else if(accountNo == 121212) {
      accountName = "Cerinova Hazanah";
    } else if(accountNo == 131313) {
      accountName ="Satria Rival Alam";
    }
    return accountName;
  }

  function historyTf(accountNo) {
    let namaPenerima = accName(accountNo);
    let listNo = "";
    let nomorList = 1;
    
    for(let i = 0; i < tfArray.length; i++) {
      listNo = listNo + `<li>Transfer Ke-${nomorList}: Transfer ke rekening <b>${namaPenerima}</b> dengan nominal <b>Rp${(tfArray[i]).toLocaleString("en-US")}</b><a href="/receipt">[RESI]</a></li>`;
      nomorList = nomorList + 1; 
    } 
    return listNo;
  }

  function feeBased(lastBankName) {
    if(lastBankName === "BJB") {
      transferFee = 0;
    } else {
      if(methodOfTransfer === "BIFAST") {
        transferFee = 2500;
      } else if(methodOfTransfer === "Transfer Online") {
        transferFee = 6500;
      }
    }
    return transferFee;
  }

  function dashboardTf() {
    let total = 0;
    for(let i = 0; i < tfArray.length; i++) {
      total = total + tfArray[i];
    }
    return total;
  }

app.get("/receipt", loginAccess, function(req, res) {
  let data = {
    bankName: lastBankName,
    accountNumber: lastAccountNo,
    accountName: lastAccountName,
    transferAmount: (lastTransferAmount).toLocaleString("en-US"),
    balance: lastBalance,
    yourAccountName: name,
    tfMethod: methodOfTransfer,
    yourAccountNumber: accountNo,
    transferFee: (feeBased(lastBankName)).toLocaleString("en-US"),
    total: (lastTransferAmount + feeBased(lastBankName)).toLocaleString("en-US")
  };
  res.render("receipt.ejs", data);
});

app.listen(port, function() {
  console.log(`Server running on port ${port}`);
});
