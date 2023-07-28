import {useState} from "react";
import Safe, {ContractNetworksConfig, EthersAdapter} from "@safe-global/protocol-kit";
import {ethers} from "ethers";
import {SafeTransactionDataPartial} from "@safe-global/safe-core-sdk-types";

const TransactionSigning = () => {
    const [safeAddress, setSafeAddress] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [value, setValue] = useState<string>("0");
    const [data, setData] = useState<string>("0x");
    const [execute, setExecute] = useState<boolean>(false);
    const run = async () => {
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
    const safeSdk = await Safe.create({ethAdapter, safeAddress, contractNetworks, isL1SafeMasterCopy: true})

    const safeTransactionData: SafeTransactionDataPartial = {
      to,
      data,
      value: ethers.utils.parseEther(value).toString(),
    }
    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })

    const txHash = await safeSdk.getTransactionHash(safeTransaction)
    console.log("ownerAddresses", await safeSdk.getOwnersWhoApprovedTx(txHash))
    const txResponse = await safeSdk.approveTransactionHash(txHash)
    await txResponse.transactionResponse?.wait()
    console.log("ownerAddresses", await safeSdk.getOwnersWhoApprovedTx(txHash))

    if (execute) {
        const txResponse = await safeSdk.executeTransaction(safeTransaction)
        await txResponse.transactionResponse?.wait()
    }
    }
  return (
    <div>
      <h1>Transaction Signing</h1>
        <form onSubmit={
            async (e) => {
                e.preventDefault();
                await run();
            }
        }>
            <label>
                Safe address:
                <input type="text" name="safe-address"
                onChange={(e) => {
                    setSafeAddress(e.target.value);
                }
                }
                value={safeAddress}
                placeholder="0x..."
                required
                />
            </label>
            <br />
            <label>
                To:
                <input type="text" name="to"
                onChange={(e) => {
                    setTo(e.target.value);
                }
                }
                value={to}
                placeholder="0x..."
                required
                />
            </label>
            <br />
            <label>
                Value:
                <input type="text" name="value"
                onChange={(e) => {
                    setValue(e.target.value);

                }
                }
                value={value}
                placeholder="0"
                required
                />
            </label>
            <br />
            <label>
                Data:
                <input type="text" name="data"
                onChange={(e) => {
                    setData(e.target.value);
                }
                }
                value={data}
                placeholder="0x..."
                required
                />
            </label>
            <br />
            <label>
                Execute (If checked, will attempt execution after signing. Note that this will fail if the transaction is not approved by threshold number of owners):
                <input type="checkbox" name="execute"
                onChange={(e) => {
                    setExecute(e.target.checked);
                }
                }
                checked={execute}
                />
            </label>
            <br />
            <button type="submit">
                {execute ? "Sign and execute" : "Sign"}
            </button>
        </form>
    </div>
  );
}
export default TransactionSigning;
