# g2me

A Rust program for managing Glicko-2 data on a collection of players.

## File Formats

### Rating Period File

A rating period file represents a series of outcomes (e.g. games, sets,
matches) that represent all outcomes in a rating period. The rating period
could be a round-robin tournament, a double elimination bracket, swiss, and so
on. The point is the outcomes specified in the file represent a discreet rating
period.

Rating period files are written in JSON, and take the form of an array of
outcomes. Each outcome element has *at least* 5 fields: `p1_name` (`String`),
`p2_name` (`String`), `p1_gc` (`i8`), `p2_gc` (`i8`), and `date_time`
(`DateTime<Utc>`). Each outcome may have an optional field `ignore` (`bool`)
which serves as a means of commenting out or ignoring an outcome. If not
specified, it will be set as `true`.

An example valid rating period file is:

```json
[
	{"p1_name":"GoodPlayer","p2_name":"DecentPlayer","p1_gc":3,"p2_gc":0,"date_time":"2017-09-21T05:00:00Z"},
	{"ignore":true,"p1_name":"ReallyGoodPlayer","p2_name":"GoodPlayer","p1_gc":3,"p2_gc":0,"date_time":"2019-09-21T05:00:00Z"},
	{"p1_name":"BestPlayer","p2_name":"ReallyGoodPlayer","p1_gc":3,"p2_gc":1,"date_time":"2019-09-21T05:00:00Z"}
]
```
