
// We just create an alias so it's easier to work with.
const BigNumber = ethers.BigNumber

/**
 * Normally you are using react or vue.
 * You would store some values globally.
 */
const state = {
    account: null
}

// Define the token you want to send.
// We use WONE, which is the wrapped version of one.
// You can get it on Testnet by wrapping regular one on 
// a exchange using your testnet wallet.
const token = {
    symbol: "WONE",
    address: "0x7466d7d0c21fa05f32f5a0fa27e12bdc06348ce2",
    decimals: 18
}

// Set the transfer amount
const transferAmount = 10

const messageContainer = document.getElementById("message-container")

function log(msg) {
    messageContainer.innerText = msg
}

if (!window.ethereum)
    log("You need MetaMask installed and enabled to use this website.")
else
    log("Press 'connect' to connect to your MetaMask Wallet")


function checkNetwork() {
    if (window.ethereum.chainId != "0x6357d2e0") {
        log("Only Harmony Testnet is supported!")
        return false
    }
    else return true
}


/**
 * The async context allows us to use the await keyword for asynchronous requests.
 */
async function connect() {

    console.log("CONNCET")
    log("Connect ...")


    const result = await window.ethereum.request({ method: 'eth_requestAccounts' });

    state.account = result[0]

    if (!state.account) {
        log("Could not get any account")
        return
    } else {
        log("Connected to your MetaMask ...")
    }

    if (!checkNetwork()) {
        return
    }

    const btn = document.getElementById("connect-btn")
    btn.style.display = "none"

    const ui = document.getElementById("send-ui")
    ui.style.display = "block"

    await updateBalance()

}


async function updateBalance() {
    const contract = await getHRC20Contract()
    const balanceInWei = await contract.balanceOf(state.account)


    /**
     * Note we lose all decimal places here. 
     * We just accept that for simplicity!
     */
    const balanceInEth = balanceInWei.div(BigNumber.from(10).pow(token.decimals))
    document.getElementById("balance").value = balanceInEth + " " + token.symbol
}

async function getHRC20Contract() {
    // Create Contract
    // Note: HRC20 (Harmony) and ERC20 (Ethereum) are basically similar.     
    const hrc20_abi = await (await fetch("./abi/erc20.json")).json()

    // Specify on which network this will run, by definying the 'provider'.
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    return new ethers.Contract(token.address, hrc20_abi, provider.getSigner())
}


async function send() {
    const receiver = document.getElementById("receiver").value
    const transferAmount = document.getElementById("send-amount").value

    if (!ethers.utils.isAddress(receiver)) {
        log("Error in provided address!")
        return
    }

    if (isNaN(transferAmount) || transferAmount <= 0) {
        log("Transfer amount needs to be a number greater than 0.")
        return
    }


    const contract = await getHRC20Contract()
    const transfer_amount_bn = BigNumber.from(transferAmount)
    const weiAmount = transfer_amount_bn.mul(BigNumber.from(10).pow(token.decimals))

    // Note: You should check balance ahead to prevent a transaction error
    // which provides a better user experience and prevents transation fee.

    // Finally we transfer the tokens by calling the transfer 
    // method on the token contract.
    // Note: If you want to use tokens in a contract you need to approve them 
    // first.
    try {
        const result = await contract.transfer(receiver, weiAmount)
        // We wait until the transaction is finalized.
        await result.wait()
        log(`Successfully transfered ${transferAmount} (${weiAmount} wei, ${token.decimals} decimals) ${token.symbol} to address:\n${receiver}`)


        // and check if the balance updated correctly!
        await updateBalance()

    } catch (e) {
        log("Contract interaction failed: " + e.message)
        console.error(e)
    }
}

