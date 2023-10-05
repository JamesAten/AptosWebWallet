import React, { useState, useEffect } from 'react';
import { AptosClient, AptosAccount, CoinClient, FaucetClient, HexString } from "aptos";
import {Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import * as buffer from "buffer";
import bs58 from 'bs58';
import TransactionsList from './TransactionsList';

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

window.Buffer = buffer.Buffer;
function ManageAccount() {

    const [account, setAccount] = useState(null);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
    const [recoveryInput, setRecoveryInput] = useState('');

    const [balance, setBalance] = useState(0);

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');

    function createAccount() {

        const account = new AptosAccount()
        console.log('account: ', account);
        console.log('privateKey: ', account.toPrivateKeyObject().privateKeyHex);

        setAccount(account)
    }

    function recoverAccount(secret) {

        console.log('secret: ', secret);

        const secretToUint8Array = hexToUint8Array(secret);
        console.log('secretToUint8Array: ', secretToUint8Array);

        const account = new AptosAccount(secretToUint8Array)
        console.log('new account: ', account);

        setAccount(account)
    }

    function toggleRecoverAccount () {
        setShowRecoveryOptions(!showRecoveryOptions);
    }

    function toggleSecretKey() {
        setShowSecretKey(!showSecretKey);
    }

    function handleRecoveryInputChange(e) {
        setRecoveryInput(e.target.value);
    }

    function handleRecoveryInputSubmit() {
        recoverAccount(recoveryInput);
    }

    function hexToUint8Array(hex) {
        // Strip the "0x" prefix if it exists
        const cleanedHex = hex.startsWith("0x") ? hex.substring(2) : hex;

        // Convert the cleaned hex string to a Uint8Array
        const uint8Array = new Uint8Array(cleanedHex.length / 2);

        for (let i = 0; i < cleanedHex.length; i += 2) {
            uint8Array[i / 2] = parseInt(cleanedHex.substring(i, i + 2), 16);
        }

        return uint8Array;

    }

    const getBalance = async () => {

        const client = new AptosClient(NODE_URL);
        const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
        const coinClient = new CoinClient(client);

        const balance = await coinClient.checkBalance(account)

        setBalance(()=> balance.toString());
    }

    const airdropAPT = async () => {
        const client = new AptosClient(NODE_URL);
        const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
        const coinClient = new CoinClient(client);

        await faucetClient.fundAccount(account.address(), 100_000_000);
    }

    const handleRecipientAddressChange = (e) => {
        setRecipientAddress(e.target.value);
    };

    const handleAmountChange = (e) => {
        setAmount(e.target.value);
    };

    function formatAsMoney(str) {
        const numberValue = parseFloat(str);
        return new Intl.NumberFormat().format(numberValue);
    }

    const handleSendAPT = async () => {
        const client = new AptosClient(NODE_URL);
        const coinClient = new CoinClient(client)

        const txnHash = await coinClient.transfer(account, recipientAddress, amount, { gasUnitPrice: BigInt(100) });
        await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:section_6b

    }

    useEffect(() => {
        setBalance(0);
    }, [account])

    return (
        <div className="manage-account-div container">
            <button className="btn btn-success rounded-pill px-3" onClick={createAccount}>Create Account</button>

            <button className="btn btn-warning rounded-pill px-3" onClick={toggleRecoverAccount}>{showRecoveryOptions ? 'Hide' : 'Show'} Recovery Options</button>

            {
                showRecoveryOptions
                &&
                (
                    <div>
                        <input
                            type={'text'}
                            placeholder={'Enter Secret Key'}
                            placeholder={'Enter Secret Key'}
                            value={recoveryInput}
                            onChange={handleRecoveryInputChange}
                        />
                        <button className="btn btn-warning rounded-pill px-3" onClick={handleRecoveryInputSubmit}>Recover Account</button>
                    </div>
                )
            }

            <hr>
            </hr>

            <h2>Account</h2>
            <div>
                {account !== null ? <p>Public Key: {account.accountAddress.toString()}</p> : null}
            </div>

            {
                account !== null
                &&
                <button
                    className="btn btn-warning rounded-pill px-3"
                    onClick={toggleSecretKey}
                >
                    {showSecretKey ? 'Hide' : 'Show'} Secret Key
                </button>
            }

            {showSecretKey && account !== null && <p>Secret Key: {account.toPrivateKeyObject().privateKeyHex}</p>}

            <div className='airdrop-div'>
                <button className="btn btn-info rounded-pill px-3" onClick={airdropAPT}>Airdrop APT</button>
            </div>

            <div className='account-balance-div'>
                <button className="btn btn-info rounded-pill px-3" onClick={getBalance}>Get Balance</button>
                <p>Balance: {formatAsMoney(balance)}</p>
            </div>

            <hr>
            </hr>

            <div className={'send-apt-div'}>
                <h2>Send APT</h2>
                <div>
                    <label>Recipient Address: </label>
                    <input type="text" value={recipientAddress} onChange={handleRecipientAddressChange} />
                </div>
                <div>
                    <label>Amount: </label>
                    <input type="number" value={amount} onChange={handleAmountChange} />
                </div>
                <button className="btn btn-primary rounded-pill px-3" onClick={handleSendAPT}>Send APT</button>
            </div>

            <hr>
            </hr>

            {/*{account !== null && <TransactionsList account={account} />}*/}

        </div>
    )
}

export default ManageAccount;