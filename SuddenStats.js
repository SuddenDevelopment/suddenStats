'use strict';
// add stat, wipe stats, update stat
// stats windows
// limits on windows, limits on stats 

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

stat types:
  numeric=min,max,avg, etc.
  uniq=value,count (also with substring search support)
  compete=uniq+numeric (also with substring search support)
  co-occurence=2 coinciding values count (also with substring search support)

TODO: move vars to private-ish like default configs
compete
stat windows
window history
conditional config based on properties in passed in object, if it has this property, use this path etc.

*/
//var _ = require('lodash');
var SuddenStats = function(objConfig){
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:1000,throttle:1000,stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.intBatch = 0;
	this.updateStats = {};
	//this.processing = false;
	var objDefaults={};
	 objDefaults.numeric = {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),type:'numeric'};
	 objDefaults.uniq = {limit:100,count:0,fs:Date.now(),ls:Date.now(),values:{}};
	 objDefaults.compete = {limit:100,min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),values:{}};;
	 objDefaults.co_occurence = {limit:100,count:0,fs:Date.now(),ls:Date.now(),values:{}};
	 objDefaults.windows = {interval:3600,history:3};


	//----====|| UTILITY FUNCTIONS ||====----\\
	//get a value from a defined path in an object
	var _get = function(objModel, strPath) {
        var arrProps = strPath.split('.'),
            prop = objModel;
        for(var i = 0, len = arrProps.length; i < len; i++) {
            if (typeof prop[arrProps[i]] !== 'undefined' && prop[arrProps[i]] !== null) { prop = prop[arrProps[i]];} 
            else { return null;}
        }
        return prop;
    };
    //for each property in an object
    var _forOwn = function(obj,fn){ _forEach(Object.keys(obj),function(v,k){ fn(obj[v],v); }); };
    //trick forEach
    var _forEach = function(arr,fn){
    	var v,i=0;
    	while(v=arr.pop()){ 
    		fn(v,i); 
    		i++;
    	}
    };
    var _defaults = function(objTarget,objDefaults){
    	_forOwn(objDefaults,function(v,k){ 
    		if(!objTarget[k]){ objTarget[k]= v;}
    		else if(typeof objTarget[k]==='object' && typeof objDefaults ==='object'){ _defaults(objTarget[k],objDefaults[k]); }
    	});
    	//console.log(objTarget,objDefaults);
    	return objTarget;
    };
    //----====|| END UTILITY FUNCTIONS ||====----\\

	var self=this;
	this.init = function(objConfig){
		//TODO: validate the structure of config passed in
		//simple mode is only for when there are just arrays of numbers sent, if it's objects cant use simple mode
		if(objConfig && objConfig.stats){ self.config.stats={}; }
		//merge defaults and config provided.
		if(typeof objConfig==='object'){self.config = _defaults(self.config,objConfig);}
		//console.log(self.config);
		//create all of the stats properties for what will be tracked
		_forOwn(self.config.stats,function(objV,k){
			//set defaults for stat
			//add any user overrides to things like type
			self.stats[k] = _defaults(objV,objDefaults[objV.type]);
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(self.stats.primary){ self.simple = true; }
	}

	this.init(objConfig);

	this.qData = function(varData){
		//EXAMPLE: objStat.qData([1,2,3,4]);
		//add data as often as you want, but batch it by time, using the deboucne config, defined in miliseconds
		//config.limit is to start kciking things out of the batch after too many per batch / time period
		
			if(Array.isArray(varData)){  
				//combine batches or arrays into the throttle timeline
				var v;
				self.intBatch=self.intBatch = self.intBatch+varData.length;
				while(v=varData.pop()){ self.batch.push(v); }
			}else{
				//for individual entries
				self.intBatch=self.intBatch+1;
				self.batch.push(varData);
			}
			/* 
			if(fnInprocess){ 
				if(self.config.limit > 2){self.config.limit--;} 
				self.config.throttle++;
			}
			*/
		if(self.intBatch>=self.config.limit){ this.addData(self.batch); }
		//this.runQ(self.batch);
	};

	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		if(arrData.length===0 && self.batch.length>0){arrData=self.batch;}
		//clear the batch
		self.batch=[]; self.intBatch=0;
		if(self.simple===true){ self.updateStats['numeric'](arrData,'primary'); }
		else{
			var arrBatch={};
			_forOwn(self.config.stats,function(objStat,strStat){
				//init the batch so all we have to do is push.
				arrBatch[strStat]={data:[]};
			});
			//----====|| LOOP THROUGH DATA GIVEN, CREATE STAT BATCHES ||====----\\
			_forEach(arrData,function(objData,k){
				//----====|| LOOP THROUGH STATS CONFIG ||====----\\
				_forOwn(self.config.stats,function(objStat,strStat){
					var varValue =false;
					switch(objStat.type){
						case 'numeric': varValue = _get(objData,objStat.path); break;
						case 'uniq': varValue = _get(objData,objStat.path); break;
						case 'compete': varValue = [_get(objData,objStat.path),_get(objData,objStat.score)]; break;
						case 'co_occurence': varValue= _get(objData,objStat.path)+'_'+_get(objData,objStat.path2); break;
					}
					//get the numbers from the object based on the path
					if(varValue !== false){ arrBatch[strStat].data.push( varValue ); }else{ console.log('value not found', strStat, objStat, objStat.path , objData); }
					//----====|| STATS WINDOWS ||====----\\
					//is a window defined for the stat?
					if(objStat.hasOwnProperty('windows') && typeof objStat.windows === 'array'){
					//for each defined window
						_forEach(objStat.windows,function(v,k){
						//does a new bucket need to be created?
							if(self.stats[strStat].windows[v.id].hasOwnProperty('current')){
								//take current bucket, snapshot it to history
								if(self.stats[strStat].windows[v.id].current.fs < (Date.now()-self.stats[strStat].windows[v.id].interval)/1000 ){
									self.stats[strStat].windows[v.id].history.push(self.stats[strStat].windows[v.id].current)
									//re-init current bucket
									self.stats[strStat].windows[v.id].current=_defaults({},objDefaults[objStat.type]);
									//process stats for current bucket
									//drop off extra buckets, beyond the history in config, default is 3
									if(self.stats[strStat].windows[v.id].history.length > self.stats[strStat].windows[k].limit){
										self.stats[strStat].windows[v.id].history.slice(self.stats[strStat].windows[k].limit * -1);
									}
								}
							}else{ 
								//init the windows for this stat
								self.stats[strStat].windows[v.id].current=_defaults({},objDefaults[objStat.type]); 
								self.stats[strStat].windows.history =[];
							}
						});
					}
				});
			});
			//----====|| PROCESS STATS BATCHES ||====----\\
			_forOwn(arrBatch,function(objStat,strStat){
				//console.log(strStat,objStat,self.stats[strStat].type,self.config.stats[strStat].type);
				self.updateStats[self.config.stats[strStat].type](objStat.data,strStat);
				arrBatch[strStat] = {};
			});
		}
	};


	//this.runQ = _.throttle(this.addData,self.config.throttle);

	this.updateStats.uniq = function(arrData, key){
		//console.log(arrData,key);
		var intCount = 1,
			v;
		while(v=arrData.pop()){
			if(self.stats[key].values.hasOwnProperty(v)){ self.stats[key].values[v]++; }
			else{self.stats[key].values[v]=1;}
			intCount = ((intCount | 1) + 1) | 1;
		}
		self.stats[key].count += intCount;
	}

	this.updateStats.compete = function(arrData, key){
		var intCount = 1,
			v;
		while(v=arrData.pop()){
			if(self.stats[key].values.hasOwnProperty(v)){ self.stats[key].values[v]++; }
			else{self.stats[key].values[v]=self.objCompeteDefaults;}
			intCount = ((intCount | 1) + 1) | 1;
		}
		self.stats[key].count += intCount;
		//TODO: add the numeric stats for score
	}

	this.updateStats.co_occurence = this.updateStats.uniq;

	this.updateStats.numeric = function(arrData, key){
		if (!(arrData instanceof Array)) { arrData = [arrData]; }
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		//console.log(this.stats);
		var intCount = 0,
			v;	
		//remember pop is backwards but fast https://jsperf.com/fastest-array-loops-in-javascript/401
		//only run through the array once :)
		
		while(v=arrData.pop()){
			if(intCount===0){ 
				var intMin = v,
					intMax = v,
					intSum = v,
					intAvg = v,
					intFirst = v,
					intLast = v; 
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