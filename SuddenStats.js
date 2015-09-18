
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
	this.config = {limit:10000,throttle:100,stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.intBatch = 0;
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
		//add data as often as you want, but batch it by time, using the deboucne config, defined in miliseconds
		//config.limit is to start kciking things out of the batch after too many per batch / time period
		if(self.intBatch<this.config.limit){
			self.batch.push(varData);
			/* 
			if(fnInprocess){ 
				if(self.config.limit > 2){self.config.limit--;} 
				self.config.throttle++;
			}
			*/
			var fnInprocess = _.throttle(self.addData(self.batch),self.config.throttle);
		}
	}

	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		
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
		//console.log(self.stats);
	};

	this.updateStat = function(arrData,key){
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		//these are light, but do them as little as necessary
		//console.log(this.stats);
		var intMin = _.min(arrData);
		var intMax = _.max(arrData);
		var intSum = _.sum(arrData);
		var intCount = arrData.length;
		var intAvg = intSum/intCount;
		if( intMin < self.stats[key].min || self.stats[key].first===false ){ self.stats[key].min = intMin; }
		if( intMax > self.stats[key].max ){ self.stats[key].max = intMax; }
		self.stats[key].count = self.stats[key].count + intCount;
		self.stats[key].total = self.stats[key].total + intSum;
		self.stats[key].last = _.last(arrData);
		if( self.stats[key].first===false ){ self.stats[key].first = _.first(arrData); self.stats[key].fs=Date.now(); }
		self.stats[key].ls=Date.now();
		self.stats[key].avg=self.stats[key].total/self.stats[key].count;
		self.stats[key].diff = intAvg-self.stats[key].lastAvg;
		self.stats[key].lastAvg = intAvg;
	}

};
module.exports = SuddenStats;