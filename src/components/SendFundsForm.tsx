import React, { useState, useEffect } from 'react';

const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

const network = bitcoin.networks.testnet;

const keyPair = bitcoin.ECPair.makeRandom({ network });
const pubkey = keyPair.publicKey;

export default function SendFundsForm() {
  const { address } = bitcoin.payments.p2pkh({ pubkey, network });

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [recepAddress, setRecepAddress] = useState('');

  const addressAPIurl = `https://api.blockcypher.com/v1/btc/test3/addrs/${address}/balance`;
  const checkAddressAPIurl = `https://api.blockcypher.com/v1/btc/test3/addrs/${recepAddress}/balance`;

  useEffect(() => {
    axios
      .get(addressAPIurl)
      .then((resp) => {
        setBalance(resp.data.balance);
      })
      .catch((error) => {
        console.log(error);
      });
  });

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (amount > 0 && recepAddress !== '') {
      axios
        .get(checkAddressAPIurl)
        .then((resp) => {
          console.log(resp);

          let newtx = {
            inputs: [{ addresses: [address] }],
            outputs: [{ addresses: [recepAddress], value: amount * 100000000 }],
          };

          let txhash = '';

          axios
            .post('https://api.blockcypher.com/v1/btc/test3/txs/new', JSON.stringify(newtx))
            .then(function (tmptx) {
              tmptx.data.pubkeys = [];
              tmptx.data.signatures = tmptx.data.tosign.map(function (tosign, n) {
                tmptx.data.pubkeys.push(keyPair.publicKey.toString('hex'));
                return bitcoin.script.signature
                  .encode(keyPair.sign(Buffer.from(tosign, 'hex')), 0x01)
                  .toString('hex')
                  .slice(0, -2);
              });

              axios
                .post(
                  'https://api.blockcypher.com/v1/btc/test3/txs/send',
                  JSON.stringify(tmptx.data),
                )
                .then(function (finaltx) {
                  console.log(finaltx.data);
                  txhash = finaltx.data.tx.hash;
                })
                .catch((error) => {
                  console.log(error);
                });
            });

          alert(`You send ${amount} btc to address ${recepAddress}. \n Transaction id: ${txhash}`);
        })
        .catch((error) => {
          console.log(error);
          alert('Error happened, please check recepient address once again.');
        });
    } else alert(`Amount can't be less or equal to 0 and recepient address can't be blank`);
  };

  return (
    <div>
      <h2>Yet Another Bitcoin Wallet</h2>
      <p>Address - {address}</p>
      <p>Balance - {balance / 100000000}</p>

      <hr />

      <h3>You can send bitcoins here:</h3>
      <form onSubmit={handleSubmit}>
        <label>Amount</label>
        <br />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <br />
        <label>Recepient Address</label>
        <br />
        <input type="text" value={recepAddress} onChange={(e) => setRecepAddress(e.target.value)} />

        <br />
        <input type="submit" value="Send =>" />
      </form>
    </div>
  );
}
