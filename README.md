# suddenStats
minimal config common statistics

intended for high volume streaming data

a statsistics library will typically require a separate lop through an array of data to get each stat. sudenStats is written to reduce the loops through an array to be as fast as possible and get everything in 1 pass. 

can use these stats to make very fast decisions in app logic, or display constantly changing values.

data can be fed to qData function as often as needed. it will buffer for specified batch time frames, and limit the batch in that timeframe to a defined limit.

the throttle time and buffer size are auto adjusting, but can be given values


##QuickStart:

Simple mode addData, nothing fancy, pass in arrays of numbers and access stats
```
var objStats = new SuddenStats();
//add a batch of data
objStats.addData([1,2,3,4,5,6]); 
objStats.addData([15,16,17,18,19,]);
//display the results of a stat
console.log(objStats.stats.primary.diff);
```

Simple Mode qData, let things get batched automatically, becuase there is a lot of data
```
var objStats = new SuddenStats();
	//throw a bunch of data in, let it batch on its own
    for(var i=1;i<=1001;i++){ objStats.qData(i); }
   console.log(objStats.stats.primary.count);
```

Pass in an object and a config to exit simple mode and do more than number stats
```
//pass in a config for stats
var objStats = new SuddenStats({
      stats:
       {
         source:{type:"uniq",path:"source"}
        ,user:{type:"compete",path:"user",score:"score"}
        ,user_source:{type:"co-occurence",path:"user",path2:"source"}
        ,score:{type:"numeric",path:"score"}
      }
    });
//pass in objects, qdata can also be used
    objStats.addData(
      [
         {"source":"wikipedia","user":"anthony","score":11}
        ,{"source":"wikipedia","user":"randall","score":19}
        ,{"source":"twitter","user":"anthony","score":8}
        ,{"source":"wikipedia","user":"wes","score":33}
        ,{"source":"wikipedia","user":"anthony","score":78}
        ,{"source":"wikipedia","user":"wes","score":43}
        ,{"source":"twitter","user":"wes","score":56}
        ,{"source":"wikipedia","user":"randall","score":24}
      ]
    ); 
   console.log(objStats.stats.source.values.wikipedia);
```

Define with windows
```
//pass in a config for stats, keep 1 minute windows for and hour and hourly windows for 1 day
var objStats = new SuddenStats({
      stats:
       {
        score:{type:"numeric",path:"score",windows:[
			 {id:'minute',interval:60,history:60}
        	,{id:'hour',interval:3600,history:24}
        ]}
      }
    });
```

##Options
- stats: define the statistics required
- windows: define the time windows that need to be kept, in seconds

###Statistics Types
- numeric: pure numerical stats
- uniq: unique value counts
- compete: unique value + numerical stats
- co-occurence: 2 value combination counts

###Windows
- seconds: interval to keep stats within as snapshots
- window count: how many windows to keep in history


references:
http://simplestatistics.org/docs/