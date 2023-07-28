import React, {useState} from 'react';
import './App.css';
import { ethers } from 'ethers'
import {EthersAdapter, SafeAccountConfig} from '@safe-global/protocol-kit'
import Safe, { SafeFactory } from '@safe-global/protocol-kit'
import { ContractNetworksConfig } from '@safe-global/protocol-kit'
import TransactionSigning from "./TransactionSigning";

function App() {
  const [additionalOwnerCount, setAdditionalOwnerCount] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(1);
  const [additionalOwnerAddresses, setAdditionalOwnerAddresses] = useState<string[]>([]);
  const [payment, setPayment] = useState<string>("0");

  const [safe, setSafe] = useState("");
  async function createSafe() {
    const web3Provider = window.ethereum
    const provider = new ethers.providers.Web3Provider(web3Provider)
    const safeOwner = provider.getSigner(0)

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: safeOwner
    })

    const chainId = await ethAdapter.getChainId()
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: {
        safeMasterCopyAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
        safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
        multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
        multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
        fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
        signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
        createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
        simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
      }
    }

    const safeFactory = await SafeFactory.create({ethAdapter, contractNetworks, isL1SafeMasterCopy: true})
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner()

    const address = await signer.getAddress()
    const owners = [address, ...additionalOwnerAddresses]
    const threshold = requiredConfirmations

    const safeAccountConfig: SafeAccountConfig = {
      owners,
      threshold,
    }
    // stringify timestamp to get a nonce
    const saltNonce = new Date().getTime().toString()
    const safe = await safeFactory.deploySafe({
        safeAccountConfig,
        saltNonce,
    })

    const safeAddress = await safe.getAddress()
    console.log("Safe at", safe, safeAddress)







    const safeSdk = await Safe.create({ethAdapter, safeAddress, contractNetworks, isL1SafeMasterCopy: true})

    console.log("Safe SDK balance", await safeSdk.getBalance())
    if (payment && payment !== "0") {
      const tx = await signer.sendTransaction({
            to: safeAddress,
            value: ethers.utils.parseEther(payment),
          }
      )
      console.log("Sent 1 ETH to safe", tx)
      await tx.wait()
      console.log("Safe SDK balance", await safeSdk.getBalance())
    }

    setSafe(safeAddress)

  }
  return (
    <div className="App">
    <h1>Safe vault creation</h1>
    {/*  create form*/}
    <form onSubmit={async (e) => {
      e.preventDefault();
      await createSafe();
    }}>
    {/*    create integer field for number of additional owners*/}
    <label htmlFor="owners">Number of additional owners</label>
    <input type="number" id="owners" name="owners" min="0" max="10"
    onChange={(e) => setAdditionalOwnerCount(parseInt(e.target.value))}
           value={additionalOwnerCount} />
      <br/>
    {/*    create integer field for number of required confirmations*/}
    <label htmlFor="confirmations">Number of required confirmations</label>
    <input type="number" id="confirmations" name="confirmations" min="1" max="10"
     onChange={(e) => {
       let value = parseInt(e.target.value)
       if (isNaN(value))
         setAdditionalOwnerCount(0)
       else
         setRequiredConfirmations(parseInt(e.target.value))
     }
    }
              value={requiredConfirmations} />
      <br/>
    {/*    create field for payment*/}
    <label htmlFor="payment">Payment(in ether)</label>
    <input id="payment" name="payment"
              onChange={(e) => {
                setPayment(e.target.value)
              }
                }
                value={payment} />
<br/>
    {/*    create list of text fields for owner address*/}
    <label htmlFor="owner-address">Additional Owner address</label>
      {[...Array(additionalOwnerCount)].map((_, i) => {
        return (
          <div key={i}>
            <input type="text" id="owner-address" name="owner-address"
            onChange={(e) => {
                const newAddresses = [...additionalOwnerAddresses];
                newAddresses[i] = e.target.value;
                setAdditionalOwnerAddresses(newAddresses);
            }
            }
            value={additionalOwnerAddresses[i] || ''}
            placeholder="0x..."
                   required
            />
          </div>
        );
      }
        )}
      <br/>
      <button type="submit">Create Safe</button>
    </form>
      {
        safe && <div>
            <h2>Safe created</h2>
            <p>Address: {safe}</p>
            </div>
      }
  <hr/>
<TransactionSigning />
    </div>
  );
}

export default App;
