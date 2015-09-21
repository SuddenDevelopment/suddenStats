'use strict';
// stats->stat->
// add stat, wipe stats, update stat
// min, max, avg, last, first, count, total
// start stop
// stats windows
// limits on windows, limits on stats 
// key, value unique, values

//Why? because stats like .min and .max need to be run over an entire array each time, these stay up to date. normally it's cheap to just dump into an array and run min and max etc when you need them, but in some cases min and max are neded to determine what to do often.

/* 
everything is optional!
objConfig={  
	 limit: 1000
	,stats:
		{
			 key:{
				 path:'path of key within an object'
				,type:'numeric, uniq, freq, co-occurence'
				,values:{starting values
			 }
		}
}
*/
var _ = require('lodash');
var SuddenStats = function(objConfig){
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:500,throttle:1000,stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.intBatch = 0;
	this.processing = false;
	var self=this;

	this.init = function(objConfig){
		//TODO: validate the structure of config passed in
		//TODO: consider using _.defaultsDeep instead
		//merge defaults and config provided.
		this.config = _.merge(this.config,objConfig);
		//create all of the stats properties for what will be tracked
		_.forOwn(this.config.stats,function(objV,k){
			//set defaults for stat
			self.stats[k] = {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),type:'numeric'};
			//add any user overrides to things like type
			_.merge(self.stats[k],objV);
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(self.stats.primary){ self.simple = true; }
	}

	this.init(objConfig);

	this.qData = function(varData){
		//EXAMPLE: objStat.qData([1,2,3,4]);
		//add data as often as you want, but batch it by time, using the deboucne config, defined in miliseconds
		//config.limit is to start kciking things out of the batch after too many per batch / time period
		if(self.intBatch<this.config.limit){
			if(Array.isArray(varData)){  
				//combine batches or arrays into the throttle timeline
				var v;
				while(v=varData.pop()){ self.batch.push(v); }
			}else{
				//for individual entries
				self.batch.push(varData);
				self.intBatch=self.intBatch+self.batch.length;
			}
			/* 
			if(fnInprocess){ 
				if(self.config.limit > 2){self.config.limit--;} 
				self.config.throttle++;
			}
			*/
		}else{ 
			this.addData(self.batch); 
		}
		//this.runQ(self.batch);
	};

	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		//if(arrData.length===0 && self.batch.length>0){arrData=self.batch;}
		//clear the batch
		self.batch=[]; self.intBatch=0;
		if(self.simple){ self.updateStat(arrData,'primary'); }
		else{
			var arrBatch={};
				_.forOwn(self.config.stats,function(objStat,strStat){
					//init the batch so all we have to do is push.
					arrBatch[strStat]={data:[]};
				});
			//data loop
			_.forEach(arrData,function(objData,k){
				//stats loop
				_.forOwn(self.config.stats,function(objStat,strStat){
					//get the numbers from the object based on the path
					arrBatch[strStat].data.push( _.get(objData,objStat.path) );
				});
			});
			_.forOwn(arrBatch,function(objStat,strStat){
				//init the batch so all we have to do is push.
				self.updateStat(objStat.data,arrBatch[strStat]);
			});
		}
		//console.log(arrData);
	};

	this.runQ = _.throttle(this.addData,self.config.throttle);

	this.updateStat = function(arrData,key){
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		//console.log(this.stats);
		var intCount = 0;		
		//remember pop is backwards but fast https://jsperf.com/fastest-array-loops-in-javascript/401
		//only run through the array once :)
		var v;
		while(v=arrData.pop()){
			if(intCount===0){ 
				var intMin = v; 
				var intMax = v;
				var intSum = v;
				var intAvg = v;
				var intFirst = v;
				var intLast = v; 
			}
			else{
				if(v<intMin){ intMin=v; }
				if(v>intMax){ intMax=v; }
				intSum = intSum+v;
				intFirst = v;
			}
			intCount++;
		}
		var intAvg = intSum/intCount;
		if( intMin < self.stats[key].min || self.stats[key].first===false ){ self.stats[key].min = intMin; }
		if( intMax > self.stats[key].max ){ self.stats[key].max = intMax; }
		self.stats[key].count = self.stats[key].count + intCount;
		self.stats[key].total = self.stats[key].total + intSum;
		self.stats[key].last = intLast;
		if( self.stats[key].first===false ){ self.stats[key].first = intFirst; self.stats[key].fs=Date.now(); }
		self.stats[key].ls=Date.now();
		self.stats[key].avg=self.stats[key].total/self.stats[key].count;
		self.stats[key].diff = intAvg-self.stats[key].lastAvg;
		self.stats[key].lastAvg = intAvg;
	};
};
module.exports = SuddenStats;