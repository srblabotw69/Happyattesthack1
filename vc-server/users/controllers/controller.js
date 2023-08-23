 
import * as IPFS from 'ipfs-core'
import fs from 'fs'

import 'dotenv/config'
 
 
 
const upload = async (req, res) => { 

  console.log("running upload()...");
  console.log(req.file);
  console.log(req.file.name);
 
  let filedir = './uploads/';

  let fileParam = req.file;
  let filename = fileParam.filename;
  let filename_org = fileParam.originalname;
  
	fs.rename(filedir + filename, filedir + filename_org, function (err) {
  if (err) throw err;
    console.log('File Renamed.');
  });

  let filepath = filedir + filename_org;

  const gateway = 'https://ipfs.io/ipfs/'
  const ipfs = await IPFS.create()
  console.log('filepath:', filepath)
  const buffer = fs.readFileSync(filepath) 

  const result = await ipfs.add(buffer)
  console.log(result)
  console.log(gateway + result.path)
  res.status(200).send(result);
 
}
 
 
export {  upload };