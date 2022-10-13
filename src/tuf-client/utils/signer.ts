import canonicalize from 'canonicalize';
import crypto from 'crypto';
import { ed25519 } from './key';
import { JSONObject } from './type';
import * as fs from 'fs';


export const verifySignature = (
  keyType: string,
  metaDataSignedData: JSONObject,
  signature: string,
  key: string,

): boolean => {
  console.log('input')


  const root = JSON.parse(
    fs.readFileSync('./1.root.json').toString()
  );
  console.log('input', root)


  const signedDataCanonical = canonicalize(root.signed) || '';
  console.log('canonicalize', JSON.stringify(metaDataSignedData) )

  const data = new TextEncoder().encode(signedDataCanonical);
  console.log('data', data)

  if (keyType === 'ed25519') {
    const publicKey = ed25519.fromHex(key);
    const result = crypto.verify(
      undefined,
      data,
      publicKey,
      Buffer.from(signature, 'hex')
    );

    return result;
  } else if (keyType === 'rsa') {
    console.log('testing')
    var result = false
    try {
  
      console.log(crypto.verify(
        'RSA-SHA512',
        data,
        {
            key: key, 
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            //saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN // default
        },
        Buffer.from(signature, 'hex')
    ))
    
    } catch (error){
      console.log('error',error)
    }

    return result
  }


  return false;
};


export const sign = (bytes: string): Record<string, any> => {
  return {}
}