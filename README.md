# suddenStats
minimal config common statistics

intended for high volume streaming data

a statsistics library will typically require a separate lop through an array of data to get each stat. sudenStats is written to reduce the loops through an array to be as fast as possible and get everything in 1 pass. 

can use these stats to make very fast decisions in app logic, or display constantly changing values.

data can be fed to qData function as often as needed. it will buffer for specified batch time frames, and limit the batch in that timeframe to a defined limit.

the throttle time and buffer size are auto adjusting, but can be given values


##QuickStart:

for node: npm install suddenstats --save
or
browser: bower install suddenstats --save

look at the tests and the demo. The demo can run in a browser

##node include
```
var SuddenStats = require('suddenstats');
```

##browser include
```
<script src="bower_components/suddenstats/utils.js"></script>
<script src="bower_components/suddenstats/SuddenStats.js"></script>
```

##API


##Configuring Stats

###Statistics Types
- numeric: pure numerical stats
- uniq: unique value counts
- compete: unique value + numerical stats
- co-occurence: 2 value combination counts

###Windows
- seconds: interval to keep stats within as snapshots
- window count: how many windows to keep in history
