# suddenStats

demo: <a href="http://suddendevelopment.com/suddenstats/demo/"> here </a>

minimal config common statistics

intended for high volume streaming data

a statsistics library will typically require a separate lop through an array of data to get each stat. sudenStats is written to reduce the loops through an array to be as fast as possible and get everything in 1 pass. 

can use these stats to make very fast decisions in app logic, or display constantly changing values.

## Features
- fast generic numeric statstics
- get stats on unique values, and unique combinations, and unique values + numeric stats
- stats trim functions to keep what's most relevant and needed for other decisions
- after in line filter callback to tie to immediate actions
- batching, with auto throttling
- rolling time windows
- auto aggregation of time windows
- in line filters, get stats for subsets
- works in node and browser

## QuickStart:

for node: 
```
npm install suddenstats --save
```
or

browser: 
```
bower install suddenstats --save
```

look at the tests and the demo. The demo can run in a browser

## node include
```
var SuddenStats = require('suddenstats');
```

## browser include
```
<script src="bower_components/suddenstats/utils.js"></script>
<script src="bower_components/suddenstats/SuddenStats.js"></script>
```

## Example use from demo
```
var objStats = new SuddenStats({
    stats:{ 
      ips:{type:"uniq",path:"user",limit:10,padding:5,filter:[{path:"server_name",op:"ne",val:"en.wikipedia.org"},{path:"user",op:"in",val:"."}]}
      ,type:{type:"uniq",path:"type",level:'hour'}
      ,server:{type:"uniq",path:"server_name",keep:"newHigh",limit:20}
      ,size:{type:"numeric",path:"length.new"}
      ,size:{type:"numeric",path:"length.new"}
      ,bot:{type:"uniq",path:"bot"}
    }
  });
```

## API
- qData(dataObject) : put the data in a small buffer to be batched for efficiency
- addData(dataObject) : apply data immediately

## Configuring Stats

### Statistics Types
- numeric: pure numerical stats
- uniq: unique value counts, gives each unique value and count
- compete: unique value + numeric stats, will give you each unique value + numeric statistics (not just counts)
- co-occurence: 2 value combination counts, same as unique but works for unique combinations. value1_value2

### Windows: defined by "level" param
- minute, keep up to 60 minute windows
- hour, keep 60 minute windows, automatically aggregate them into hourly windows
- day, 60 minute windows, 24 hourly windows, daily windows.

### Filters:
- eq: exact matches
- in: substring or item in array match
- gt: greater than
- lt: less than

### Options
- limit: max number of values to trim to
- padding: How many items over limit before starting a trim, less frquent trims may be faster
- keep: method for decising which to keep (newest),"newHigh"