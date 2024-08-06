// Imports
use glicko2::*;
use serde::{Serialize,Deserialize};
use serde_json;
use chrono::{DateTime, TimeZone, Utc, Local};
use chrono::offset::LocalResult;
use chrono::offset::LocalResult::{Single, Ambiguous, None};


/// Converts a year, month, day integer pair from the local time zone to a full, complete, Utc
/// DateTime.
fn convert_ymd_to_utc_ymd_hms(year: i32, month: u32, day: u32) -> Result<DateTime<Utc>, String> {
    // A possible instance of the year, month, day, converted to a full DateTime<Local>
    let dt_res: LocalResult<DateTime<Local>> = Local.with_ymd_and_hms(year, month, day, 0, 0, 0);

    // Return an error if the given year, month, day could NOT be converted to a single, valid
    // DateTime. Return the DateTime converted to UTC if the year, month, day could be converted
    // to a single, valid DateTime
    match dt_res {
        Single(s) => Ok(s.with_timezone(&Utc)),
        Ambiguous(_, _) => Err(String::from("Given date was ambiguous")),
        None => Err(String::from("Given date was invalid")),
    }
}


fn main() {
    // let rating_period_ht: hashmap;
    // let rating_period_ht: i32 = 0;


    println!("");
}
