

const fetch = require('node-fetch');
var token =""; 
var startup = "禧涤智能"; // as in 项目 in 企名片
var urlencoded = new URLSearchParams();
urlencoded.append("token", token);
urlencoded.append("product", startup);
urlencoded.append("src", "mumian");

var requestOptions = {
  method: 'POST',
  headers: {"Content-Type":"application/x-www-form-urlencoded",},//myHeaders,
  body: urlencoded,
  redirect: 'follow'
};

//https://sleepy-sierra-74590.herokuapp.com/
var baseUrl = "https://openapi.qimingpian.cn/hz/";
var tokenJQuery = "?token="+token;
var sourceJQuery = "&src=mumian";

 
async function getBasicData() {
	console.log(baseUrl + "projectbasic"+tokenJQuery+"&product="+startup+sourceJQuery)
	const response = await fetch(encodeURI(baseUrl + "projectbasic"+tokenJQuery+"&product="+startup+sourceJQuery), requestOptions);
	const data = await response.json();
	return data;
}

async function getTeamData(company,requestOptionsCompany) {
        const response = await fetch(encodeURI(baseUrl + "teammember"+tokenJQuery+"&company="+company+sourceJQuery), requestOptionsCompany);
        const data = await response.json();
        console.log("team data?",data);
	return data;
}

async function getFundingData(company,requestOptionsCompany) {
        const response = await fetch(encodeURI(baseUrl + "historyRongzi"+tokenJQuery+"&company="+company+sourceJQuery), requestOptionsCompany);
        const data = await response.json();
	console.log("funding data?",data);
	console.log("company",company)
	return data;
}



var rawBasicData;
var rawFundingData;
var rawTeamData;

async function app() {
        rawBasicData = await getBasicData();
	rawBasicData = rawBasicData["data"][0];
	var company = rawBasicData["company_name"];
	
	var urlencoded_company = new URLSearchParams();
	urlencoded_company.append("token",token);
	urlencoded_company.append("company",company);
	urlencoded_company.append("src", "mumian");
	
	var requestOptionsCompany = {
	  method: 'POST',
	  headers: {"Content-Type":"application/x-www-form-urlencoded",},//myHeaders,
	  body: urlencoded_company,
	  redirect: 'follow'
	};
 	
	rawTeamData = await getTeamData(company,requestOptionsCompany);	
	rawTeamData = rawTeamData["data"]["members"];
	
	rawFundingData = await getFundingData(company,requestOptionsCompany);
	rawFundingData = rawFundingData["data"];
	
	var existsAngelRound=false;
	var existsPreA=false;	
	var existsLastRound=false;
	var rawFundingDataList = rawFundingData["list"];
	var otherRoundOrgs = [];
	var angelRoundData = {};
	var preARoundData = {};
	var FAs = [];
	if (rawFundingData.count!=="0"){
		var rounds = [];
		var includedRoundOrgs = [];		
		rawFundingDataList.forEach(function(item) {
			if (item["fa_name"]!=""){
				FAs.push(item["fa_name"]);
			}
                        rounds.push(item.round);
			otherRoundOrgs.push(item["organization_name"]);
			if (item.round=='Pre-A轮'){
				includedRoundOrgs.push(item["organization_name"]);
				preARoundData = item;
			}
			if (item.round=='天使轮'){
				includedRoundOrgs.push(item["organization_name"]);
				angelRoundData = item;
			}
		})
 
		console.log("rounds",rounds);
		var lastRoundData = rawFundingDataList[0];
		includedRoundOrgs.push(lastRoundData["organization_name"]);
		
		var otherRoundOrgs = otherRoundOrgs.filter(function(itm){
  			return !includedRoundOrgs.includes(itm);
		});

		existsAngelRound = rounds.includes('天使轮');
		existsPreA = rounds.includes('Pre-A轮');
		existsLastRound = rounds != [];
	}

	var Airtable = require('airtable');
	var base = new Airtable({apiKey: 'keyfTrPeQQ5pALrGn'}).base('apppFPdqAzVnkr1V7'); // tech pipeline
	
	base('The Pipeline').update([
	  {
	    "id":"recCEd38LWtBw6Emr",
	    "fields": {
	      "Name": startup,
	      "做啥的（一句话）": "",//rawBasicData["yewu"],
	      "Website（官网）": "",//rawBasicData["gw_link"],
	      //"Website（企名片/Crunchbase）": 
	      "天使轮 金额": existsAngelRound ? angelRoundData["money"] : "",
	      "天使轮 机构": existsAngelRound ? angelRoundData["organization_name"] : "",
	      "Pre-A轮 金额": existsPreA ? preARoundData["money"] : "",
              "Pre-A轮 机构": existsPreA ? preARoundData["organization_name"] : "",
              "Last Round 金额": existsLastRound ? lastRoundData["money"] : "",
              "Last Round 轮次": existsLastRound ? lastRoundData["round"] : "",
              "last round 时间": existsLastRound ? lastRoundData["date"] : "", 
	      "Last Round 机构": existsLastRound ? lastRoundData["organization_name"] : "",
	      "Other轮次 机构": otherRoundOrgs.join(","),
	      "Current FA and Last FA": FAs.join(","),
	    }
	  }
	], function(err, records) {
	  if (err) {
	    console.error(err);
	    return;
	  }
	  records.forEach(function(record) {
	    console.log(record.get('Name'));
	  });
	});
}

app()
