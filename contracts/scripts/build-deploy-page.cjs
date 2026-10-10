const fs = require('fs');
const path = require('path');

const unsignedPath = path.join(__dirname, '../mainnet-checkout.unsigned.json');
const unsigned = JSON.parse(fs.readFileSync(unsignedPath, 'utf8'));
const data = unsigned.request.data;
const deployer = unsigned.request.from;

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mercenta — Деплой в Arc Mainnet</title>
  <style>
    body {
      background: #080a0f;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #0d121d;
      border: 1px solid #1e293b;
      border-radius: 20px;
      padding: 36px;
      max-width: 620px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      margin-bottom: 12px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .info-grid {
      background: #131a29;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
    }
    .val {
      font-family: monospace;
      color: #e2e8f0;
      font-weight: 600;
    }
    button {
      width: 100%;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      margin-top: 10px;
    }
    .btn-connect {
      background: #0284c7;
      color: white;
    }
    .btn-connect:hover {
      background: #0369a1;
    }
    .btn-deploy {
      background: #2563eb;
      color: white;
      display: none;
    }
    .btn-deploy:hover {
      background: #1d4ed8;
    }
    .btn-unpause {
      background: #10b981;
      color: white;
      display: none;
    }
    .btn-unpause:hover {
      background: #059669;
    }
    .status {
      margin-top: 20px;
      padding: 16px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.5;
      display: none;
    }
    .status.info {
      background: rgba(2, 132, 199, 0.15);
      border: 1px solid #0284c7;
      color: #bae6fd;
      display: block;
    }
    .status.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #a7f3d0;
      display: block;
    }
    .status.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
      display: block;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Arc Mainnet Deployment</div>
    <h1>Деплой MercentaCheckout</h1>
    <p>Безопасный запуск смарт-контракта без выгрузки или передачи приватных ключей. Транзакция подписывается напрямую вашим кошельком (MetaMask / Rabby).</p>

    <div class="info-grid">
      <div class="info-row"><span class="label">Сеть</span><span class="val">Arc Mainnet (Chain ID 5042)</span></div>
      <div class="info-row"><span class="label">Deployer / Owner</span><span class="val">${deployer.slice(0, 10)}...${deployer.slice(-8)}</span></div>
      <div class="info-row"><span class="label">Лимит на 1 чек</span><span class="val">5 000 USDC</span></div>
      <div class="info-row"><span class="label">Дневной лимит</span><span class="val">100 000 USDC</span></div>
      <div class="info-row"><span class="label">Ориентир комиссии</span><span class="val">~0.048 USDC</span></div>
    </div>

    <button id="btnConnect" class="btn-connect" onclick="connectWallet()">1. Подключить MetaMask</button>
    <button id="btnDeploy" class="btn-deploy" onclick="deployContract()">2. Развернуть контракт (Deploy)</button>
    <button id="btnUnpause" class="btn-unpause" onclick="unpauseContract()">3. Активировать продажи (Unpause)</button>

    <div id="statusBox" class="status"></div>
  </div>

  <script>
    const EXPECTED_DEPLOYER = "${deployer.toLowerCase()}";
    const CREATION_DATA = "${data}";
    const ARC_CHAIN = {
      chainId: "0x13b2",
      chainName: "Arc Mainnet",
      nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
      rpcUrls: ["https://rpc.mainnet.arc.io"],
      blockExplorerUrls: ["https://arcscan.app"]
    };

    let userAccount = null;
    let deployedAddress = null;

    function setStatus(msg, type = "info") {
      const box = document.getElementById("statusBox");
      box.className = "status " + type;
      box.innerHTML = msg;
    }

    async function connectWallet() {
      if (!window.ethereum) {
        return setStatus("MetaMask не обнаружен. Установите или активируйте браузерный кошелек.", "error");
      }
      try {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x13b2" }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({ method: "wallet_addEthereumChain", params: [ARC_CHAIN] });
          } else {
            throw switchError;
          }
        }

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        userAccount = accounts[0].toLowerCase();

        if (userAccount !== EXPECTED_DEPLOYER) {
          return setStatus("Подключен адрес: " + userAccount + "<br><b>Ошибка:</b> Для деплоя выберите в MetaMask адрес " + EXPECTED_DEPLOYER, "error");
        }

        document.getElementById("btnConnect").style.display = "none";
        document.getElementById("btnDeploy").style.display = "block";
        setStatus("Кошелек успешно подключен к Arc Mainnet!<br>Адрес: " + userAccount + "<br>Нажмите <b>Развернуть контракт</b> для отправки транзакции.", "info");
      } catch (err) {
        setStatus("Ошибка подключения: " + err.message, "error");
      }
    }

    async function deployContract() {
      try {
        setStatus("Подтвердите транзакцию создания контракта в MetaMask...<br>(Комиссия сети: около 0.048 USDC)", "info");
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: userAccount,
            data: CREATION_DATA,
            value: "0x0"
          }]
        });

        setStatus("Транзакция отправлена в сеть Arc Mainnet!<br>Tx Hash: <b>" + txHash + "</b><br>Ожидание включения в блок...", "info");

        let receipt = null;
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 2000));
          receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash]
          });
          if (receipt) break;
        }

        if (receipt && receipt.contractAddress) {
          deployedAddress = receipt.contractAddress;
          document.getElementById("btnDeploy").style.display = "none";
          document.getElementById("btnUnpause").style.display = "block";
          setStatus("<b>УСПЕХ! MercentaCheckout успешно развернут!</b><br>Адрес контракта: <b>" + deployedAddress + "</b><br>Tx Hash: " + txHash + "<br><br>Контракт сейчас на паузе. Нажмите <b>3. Активировать продажи</b>, чтобы открыть приём платежей.", "success");
        } else {
          setStatus("Транзакция отправлена: " + txHash + "<br>Проверьте подтверждение в ArcScan.", "info");
        }
      } catch (err) {
        setStatus("Ошибка отправки транзакции: " + err.message, "error");
      }
    }

    async function unpauseContract() {
      if (!deployedAddress) return setStatus("Адрес развернутого контракта не найден.", "error");
      try {
        setStatus("Подтвердите включение продаж (unpauseSales) в MetaMask...", "info");
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: userAccount,
            to: deployedAddress,
            data: "0xd74e6ccc"
          }]
        });
        setStatus("<b>Поздравляем! Продажи активированы на Mainnet!</b><br>Tx Hash: " + txHash + "<br>Адрес контракта: " + deployedAddress, "success");
      } catch (err) {
        setStatus("Ошибка unpause: " + err.message, "error");
      }
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../deploy.html'), html);
console.log('deploy.html generated successfully!');
