/*
 * To run this, install node.js ('node' for most package managers), and npm.
 * cd into this directory and run 'npm install', then you can run this
 * interactive helper with 'node dlsmashgg.js'
 */

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var readline = require('readline');
var readline = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const fs = require('fs')

function send(method, url, data, callback){
	let xhr = new XMLHttpRequest();

	xhr.onload = function() {
		if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
		else callback(null, JSON.parse(xhr.responseText));
	};

	xhr.open(method, url, true);
	if (!data) xhr.send();
	else{
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(JSON.stringify(data));
	}
}

function convSecondsToDMY(secs) {
	var t = new Date(1970, 0, 1);
	t.setSeconds(secs);
	return t.getDate() + " " + (t.getMonth() + 1) + " " + t.getFullYear();
}



/* Ex. parameter: "toronto-stock-exchange-20" */
function get_group_ids(tournament_url_ending, callback) {

	groupidsurl="https://api.smash.gg/tournament/" + tournament_url_ending
		+ "?expand[]=phase&expand[]=groups&expand[]=event"

	send("GET", groupidsurl, null, function(err, res) {
		var e = res.entities.event;
		var events = []

		for (var i = 0; i < e.length; i++) {
			events.push({
				name : e[i].name,
				id : e[i].id,
				tid : e[i].tournamentId
			});
		}

		var p = res.entities.phase;
		var phases = []

		for (var i = 0; i < p.length; i++) {
			phases.push({
				name : p[i].name,
				id : p[i].id,
				eid : p[i].eventId
			});
		}

		var g = res.entities.groups
		var groups = []

		for (var i = 0; i < g.length; i++) {
			groups.push({
				id : g[i].id,
				pid : g[i].phaseId
			});
		}

		function convPhaseIdToFullPhaseName(x) {
			var name = ""

			for (var i = 0; i < phases.length; i++) {
				var y = phases[i].id

				if (x == y) {
					name = phases[i].name; // += "Amateur Bracket", "Pro Bracket"
					for (var j = 0; j < phases.length; j++) {
						if (phases[i].eid === events[j].id) {
							name = events[j].name + ": " + name
							return name
						}
					}
				}
			}
			return name;
		}

		var ret = []

		for (var i = 0; i < g.length; i++) {
			ret.push({
				id : g[i].id,
				name : convPhaseIdToFullPhaseName(g[i].phaseId)
			});
		}

		callback(ret)
	});
}

function process_bracket(group_id, callback) {
	smashurl="https://api.smash.gg/phase_group/" + group_id
		+ "?expand[]=entrants&expand[]=event&expand[]=phase&expand[]=sets&expand[]=participants&mutations[]=playerData"

	var ret = []

	send("GET", smashurl, null, function(err, res) {

		/* Generate list of set data */
		/* {{{ */
		var sets = res.entities.sets
		if (sets != null ) {
			var set_json = []
			var player_json = []

			for (i = 0; i < sets.length; i++) {

				var s = sets[i];
				if (s.entrant1Id == null || s.entrant2Id == null) continue;

				set_json.push({
					id : s.id,
					p1id : s.entrant1Id,
					p2id : s.entrant2Id,
					p1name : "",
					p2name : "",
					p1tag : "",
					p2tag : "",
					p1score : s.entrant1Score,
					p2score : s.entrant2Score,
					isgf : s.isGF,
					date : convSecondsToDMY(s.createdAt)
				})
			}
		/* If there were no sets */
		} else {
			callback([]);
			return
		}
		/* }}} */

		/* Generate list of player id, player name pairs */
		/* {{{ */
		var players = res.entities.entrants
		if (players != null) {
			for (i = 0; i < players.length; i++) {
				var p = players[i]
				var realnameinfo = p.mutations.players

				for (var x in realnameinfo) {
					realname = realnameinfo[''+x].name
				}

				player_json.push({
					id : p.id,
					tag : p.name,
					name : realname
				})
			}
		/* If there were no entrants */
		} else {
			callback([]);
			return
		}
		/* }}} */

		/* Fill in player's name and tag from provided player ids */
		/* {{{ */
		function swap_name(x) {
			for (var i = 0; i < player_json.length; i++) {
				if (x.p1id === player_json[i].id) {
					x.p1name = player_json[i].name
					x.p1tag = player_json[i].tag
				}
				if (x.p2id === player_json[i].id) {
					x.p2name = player_json[i].name
					x.p2tag = player_json[i].tag
				}
			}
			return x
		}
		/* }}} */

		/* Fill in player names, given their ids, using 'swap_name(x)' */
		var d = set_json.map(swap_name)

		/* Sort sets in order of creation, with Grand Finals last */
		/* {{{ */
		d.sort(function(a, b) {
			if (a.isgf === true) return 1
			if (b.isgf === true) return -1

			if (a.id < b.id) return -1
			else if (a.id > b.id) return 1
			else return 0
		});
		/* }}} */

		/* Print data in the format G2ME requires */
		for (var i = 0; i < d.length; i++) {
			var t = d[i]
			p1n = t.p1name
			p2n = t.p2name
			if (p1n == "" || p1n == null) p1n = t.p1tag
			if (p2n == "" || p2n == null) p2n = t.p2tag

			ret.push("\"" + p1n + "\" \"" + p2n + "\" "
				+ t.p1score + " " + t.p2score + " " + t.date)
		}

		callback(ret)
	});
}


readline.question("Please enter tournament identifier (Ex. \"toronto-stock-exchange-20\"): ", (t_name) => {
	function present_options() {
		console.log("    all");
		get_group_ids(t_name, function(gids) {

			for (var i = 0; i < gids.length; i++) {
				console.log("    " + gids[i].id + "    " + gids[i].name)
			}

			if (gids.length < 1) return;

			readline.question("Please enter a group id or \"all\" (Ex. \"" + gids[0].id + "\", \"exit\" to exit): ", (input) => {
				if (input === "exit") {
					readline.close()
					return 0
				} else if (input === "all") {

					/* *p*rocess *b*racket recursive "loop" */
					function pb(set_num, callback) {
						process_bracket(gids[set_num].id, function(sets) {
							console.log("\n")

							if (sets.length == 0) {
								console.log("ERROR: No sets were played in the given bracket. Were there any entrants?")
								return present_options()
							}

							var data = ""

							/* Print name of bracket */
							console.log(gids[set_num].name + " (" + gids[set_num].id + ")")
							console.log("")

							/* Print (and store) set data */
							for (var i = 0; i < sets.length; i++) {
								console.log(sets[i])
								data += sets[i] + "\n"
							}

							console.log("\n")
							readline.question("Write output to file (Ex. \"bracket.txt\", \"skip\" to continue): ", (input) => {

								/* {{{ */
								function pb_next() {
									/* If we have not "looped" through all the
									 * brackets, continue looping */
									if (set_num < gids.length - 1) {
										set_num += 1;
										pb(set_num, callback)
									} else {
										console.log("\n")
										console.log("End of brackets")
										console.log("\n")
										callback()
									}
								}
								/* }}} */

								if (input != "skip") {
									fs.writeFile(input, data, (err) => {
										if (err) throw err;

										pb_next()
									});
								} else {
									console.log("Skipping...")
									pb_next()
								}
							});
						});
					}

					/* Start recursive "loop" at first element */
					var i = 0;
					pb(i, function() {
						present_options();
					});

				} else {
					process_bracket(input, function(sets) {
						console.log("\n")

						if (sets.length == 0) {
							console.log("ERROR: No sets were played in the given bracket. Were there any entrants?")
							return present_options()
						}

						var data = ""

						for (var i = 0; i < sets.length; i++) {
							console.log(sets[i])
							data += sets[i] + "\n"
						}

						console.log("\n")
						readline.question("Write output to file (Ex. \"bracket.txt\", \"skip\" to continue): ", (input) => {
							if (input != "skip") {
								fs.writeFile(input, data, (err) => {
									if (err) throw err;
									return present_options()
								});
							} else {
								console.log("Skipping...")
								return present_options()
							}
						});
					});
				}
			})
		})
	}
	present_options()
})
