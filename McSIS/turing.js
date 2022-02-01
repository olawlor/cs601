/* JavaScript turing machine that adds one in binary (forever) */
tape=[];
head=0; // starting spot in tape

state='lsb';

table={
	"lsb": {
		"1": { "write":"1","move":+1,"state":"lsb"},
		"0": { "write":"0","move":+1,"state":"lsb"},
		" ": { "write":" ","move":-1,"state":"car"},
	},
	"car": {
		"1": { "write":"0", "move":-1, "state":"car"},
		"0": { "write":"1", "move":+1, "state":"lsb"},
		" ": { "write":"1", "move":+1, "state":"lsb"},
	},
};

var leash=10000;
while (leash-->0) {
	var s=table[state][tape[head]||" "];
	tape[head]=s.write;
	head+=s.move;
	state=s.state;
	
	// Show the tape (optional)
	var out=state+" ";
	for (var i=-10;i<10;i++) {
		var c=tape[i];
		if (c==undefined) c=' ';
		if (i==head) out+=">"+c+"<";
		else out+=c;
	}
	console.log(out);
}

