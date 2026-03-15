/*
 String replacer GUI: javascript code

 Originally written by Jared Grace using many separate mjs files:
     https://github.com/Jared-Grace/love.git
 For deployment these were inlined, combined together, and minified.
 
 Beautified by Orion Lawlor using:
    uglifyjs replace.js -b -o replacer.js
 Then heavily reworked using Gemini 3 Pro 2026-03.
 
 This version uses the same ruleset, but has a heavily reworked GUI.
 
 Dr. Orion Lawlor, lawlor@alaska.edu, 2026-03-14 (Public Domain)
*/
"use strict";


// ==========================================
// 1. RULE DEFINITIONS 
// ==========================================

function ruleset_words() {
    return {
        name: "Word List",
        why: "This set of replacements shows how you can create a set of words from the same start symbol A.",
        rules: [ "A > code", "A > food", "A > moose" ],
        goals: [ {
            start: "A",
            end: "code"
        }, {
            start: "A",
            end: "food"
        }, {
            start: "A",
            end: "moose"
        } ]
    };
}


function ruleset_regexDFA() {
    return {
        name: "Regular Expression (regex DFA)",
        why: "This deterministic grammar represents the regex 'a*b*e'.  A is the grammar start state, B is a second state.",
        rules: [ "A > aA", "A > bB", "B > bB", "B > e"],
        goals: [ {
            start: "A",
            end: "aaabe"
        }, {
            start: "A",
            end: "abe"
        }, {
            start: "A",
            end: "bbbe"
        }, {
            start: "A",
            end: "aabbe"
        } ]
    };
}


function ruleset_regexNFA() {
    return {
        name: "Regular Expression (regex NFA)",
        why: "This grammar represents the regex 'a*b*'.  A is the grammar start state, B is a second state. The nondeterministic grammar is simpler, but applying it is tricky because you have several choices to make.",
        rules: [ "A > aA", "A > B", "B > bB", "B > "],
        goals: [ {
            start: "A",
            end: "aaab"
        }, {
            start: "A",
            end: "bb"
        }, {
            start: "A",
            end: "aabb"
        } ]
    };
}

function ruleset_CFG() {
    return {
        name: "Context Free Grammar (CFG)",
        why: "Capital letters like F (function declaration), N (identifier name), and A (argument list) represent nonterminal symbols in a grammar, and can expand to the corresponding pieces of code.",
        rules: [ "F > func_N(A)", "A > N,A", "A > N", "N > x N", "N > y N", "N > " ],
        goals: [ {
            start: "F",
            end: "func_x(y)"
        }, {
            start: "F",
            end: "func_y(x,yy)"
        }, {
            start: "F",
            end: "func_xx(y,yx,xy)"
        } ]
    };
}

function ruleset_TM() {
    return {
        name: "Turing Machine (TM)",
        why: "$A represents the TM read/write head in state A, the next character is what it can read on the tape (with a 4-bit binary string).  Apply the rules to implement binary increment, and halt when done carrying.",
        rules: [ "$S0 > $H1", "1$S1 > $S10", "0$S1 > $S00" ],
        goals: [ {
            start: "000$S0",
            end: "000$H1"
        }, {
            start: "001$S1",
            end: "0$H100"
        }, {
            start: "011$S1",
            end: "$H1000"
        } ]
    };
}


function ruleset_NTM() {
    return {
        name: "Nondeterministic Turing Machine (NTM)",
        why: "$A represents the TM read/write head in state A, the next character is what it can read on the tape.  Apply the rules to move along the tape and reach the specified halt state $H.",
        rules: [ "$S0 > 0$S", "$S1 > 1$S", "$S > $H" ],
        goals: [ {
            start: "$S0100",
            end: "$H0100"
        }, {
            start: "$S0100",
            end: "01$H00"
        }, {
            start: "$S0100",
            end: "0100$H"
        } ]
    };
}



// Jared Grace original rulesets, with Dr. Lawlor's descriptions:
function ruleset_swap_3() {
    return {
        name: "Swap 3",
        why: "Shuffle the a across the string by applying the correct rules.",
        rules: [ "a b > b a", "a c > c a", "a d > d a" ],
        goals: [ {
            start: "acdbd",
            end: "cdbda"
        }, {
            start: "adbadc",
            end: "dbdcaa"
        }, {
            start: "adbcadcb",
            end: "dbcdcbaa"
        } ]
    };
}
function ruleset_unary_to_binary_equations() {
    return {
        name: "Unary to Binary Equations",
        rules: [ "e = b > c e = b c", "c c > c + b c", "d b > b d", "d c > a d", "d e = > = d", "d + > + d", "b a > b 1", "1 a > a 0", "0 a > 1" ],
        goals: [ {
            start: "dbce=bc",
            end: "bdce=bc"
        }, {
            start: "dbce=bc",
            end: "bade=bc"
        }, {
            start: "dbce=bc",
            end: "b1de=bc"
        }, {
            start: "dbce=bc",
            end: "b1=dbc"
        }, {
            start: "dbce=bc",
            end: "b1=bdc"
        }, {
            start: "dbce=bc",
            end: "b1=bad"
        }, {
            start: "dbce=bc",
            end: "b1=b1d"
        }, {
            start: "dbce=bc",
            end: "dbcce=bcc"
        }, {
            start: "dbce=bc",
            end: "dbccce=bccc"
        }, {
            start: "dbce=bc",
            end: "dbccccce=bccccc"
        }, {
            start: "dbcce=bcc",
            end: "dbc+bce=bcc"
        }, {
            start: "dbccccce=bccccc",
            end: "dbc+bccc+bce=bccc+bcc"
        }, {
            start: "dbcc+bce=bccc",
            end: "baad+bce=bccc"
        }, {
            start: "bad+bcce=bccc",
            end: "ba+baade=bccc"
        }, {
            start: "baad+bce=bccc",
            end: "baa+ba=baaad"
        }, {
            start: "baa+baa=baaaad",
            end: "b10+b10=b100d"
        }, {
            start: "dbce=bc",
            end: "b1+b10=b11d"
        }, {
            start: "dbce=bc",
            end: "b10+b11=b101d"
        } ]
    };
}
function ruleset_unary_to_binary_equations_preparation() {
    return {
        name: "Unary to Binary Equations Preparation",
        rules: [ "d e = > = d", "= d > d f =", "d > d d", "d d > d e d", "e d > e =" ],
        goals: [ {
            start: "d",
            end: "dd"
        }, {
            start: "d",
            end: "ded"
        }, {
            start: "d",
            end: "de="
        }, {
            start: "de=",
            end: "=d"
        }, {
            start: "de=",
            end: "df="
        }, {
            start: "de=",
            end: "ddf="
        }, {
            start: "de=",
            end: "dedf="
        }, {
            start: "de=",
            end: "df=f="
        } ]
    };
}
function ruleset_grow_same_three_different() {
    return {
        name: "Grow Same Three Different",
        rules: [ "e = b > c e = b c" ],
        goals: [ {
            start: "e=b",
            end: "cce=bcc"
        }, {
            start: "e=b",
            end: "cccce=bcccc"
        } ]
    };
}
function ruleset_two_different_grow_same() {
    return {
        name: "Two Different Grow Same",
        rules: [ "e b > c e b c" ],
        goals: [ {
            start: "eb",
            end: "ccebcc"
        }, {
            start: "eb",
            end: "ccccebcccc"
        } ]
    };
}
function ruleset_shrink_same_three_different() {
    return {
        name: "Shrink Same Three Different",
        rules: [ "c e = b c > e = b" ],
        goals: [ {
            start: "cce=bcc",
            end: "e=b"
        }, {
            start: "cccce=bcccc",
            end: "e=b"
        } ]
    };
}
function ruleset_three_different_grow_same() {
    return {
        name: "Three Different Grow Same",
        rules: [ "e = b > c e = b c" ],
        goals: [ {
            start: "e=b",
            end: "cce=bcc"
        }, {
            start: "e=b",
            end: "cccce=bcccc"
        } ]
    };
}
function ruleset_binary_counting() {
    return {
        name: "Binary Counting",
        rules: [ "0 a > 1", "1 a > a 0", "c > a c", "b a > b 1" ],
        goals: [ {
            start: "b0c",
            end: "b0ac"
        }, {
            start: "b0c",
            end: "b1c"
        }, {
            start: "b0c",
            end: "b10c"
        }, {
            start: "b0c",
            end: "b11c"
        }, {
            start: "b0c",
            end: "b101c"
        }, {
            start: "b0c",
            end: "b111c"
        }, {
            start: "b0c",
            end: "b1010c"
        } ]
    };
}
function ruleset_binary_counting_prepare_2() {
    return {
        name: "Binary Counting Prepare 2",
        rules: [ "0 a > 1", "1 a > a 0", "1 > 1 1" ],
        goals: [ {
            start: "01a",
            end: "10"
        }, {
            start: "01a",
            end: "100"
        }, {
            start: "01a",
            end: "10000"
        } ]
    };
}
function ruleset_binary_counting_prepare_1() {
    return {
        name: "Binary Counting Prepare 1",
        rules: [ "1 a > a 0", "1 > 1 1" ],
        goals: [ {
            start: "1a",
            end: "1a0"
        }, {
            start: "1a",
            end: "a000"
        } ]
    };
}
function ruleset_unary_equations_adding() {
    return {
        name: "Unary Equations Adding",
        rules: [ "= > 1 = 1", "1 1 > 1 + 1" ],
        goals: [ {
            start: "1=1",
            end: "11=11"
        }, {
            start: "1=1",
            end: "11=1+1"
        }, {
            start: "1=1",
            end: "1+1=11"
        }, {
            start: "1=1",
            end: "1+11=111"
        }, {
            start: "1=1",
            end: "1+11=11+1"
        }, {
            start: "1=1",
            end: "1+1+111=11111"
        } ]
    };
}
function ruleset_shrink_left_pair_replace_right_same() {
    return {
        name: "Shrink Left Pair Replace Right Same",
        rules: [ "b a > a", "b c > b b" ],
        goals: [ {
            start: "baba",
            end: "aa"
        }, {
            start: "bba",
            end: "a"
        }, {
            start: "bca",
            end: "bba"
        }, {
            start: "bbba",
            end: "a"
        }, {
            start: "bcbca",
            end: "a"
        }, {
            start: "bcbabcba",
            end: "aa"
        } ]
    };
}
function ruleset_grow_left_pair_change_right() {
    return {
        name: "Grow Left Pair Change Right",
        rules: [ "a > b a", "b b > b c" ],
        goals: [ {
            start: "aa",
            end: "baba"
        }, {
            start: "a",
            end: "bba"
        }, {
            start: "bba",
            end: "bca"
        }, {
            start: "a",
            end: "bbba"
        }, {
            start: "a",
            end: "bcbca"
        }, {
            start: "aa",
            end: "bcbabcba"
        } ]
    };
}
function ruleset_expand_collapse() {
    return {
        name: "Expand Collapse",
        rules: [ "a > b b", "b b > c" ],
        goals: [ {
            start: "a",
            end: "c"
        }, {
            start: "aa",
            end: "cc"
        }, {
            start: "bab",
            end: "cc"
        }, {
            start: "aa",
            end: "bcb"
        }, {
            start: "aaa",
            end: "bccb"
        }, {
            start: "aaaaa",
            end: "acbbca"
        } ]
    };
}
function ruleset_shrink_different_2() {
    return {
        name: "Shrink Different 2",
        rules: [ "b c > a", "d e > b" ],
        goals: [ {
            start: "dec",
            end: "a"
        }, {
            start: "decdec",
            end: "aa"
        }, {
            start: "decbcbcdec",
            end: "aaaa"
        } ]
    };
}
function ruleset_grow_different_2() {
    return {
        name: "Grow Different 2",
        rules: [ "a > b c", "b > d e" ],
        goals: [ {
            start: "a",
            end: "dec"
        }, {
            start: "aa",
            end: "decdec"
        }, {
            start: "aaaa",
            end: "decbcbcdec"
        } ]
    };
}
function ruleset_replace_flow() {
    return {
        name: "Replace Flow",
        rules: [ "a > b", "b > c" ],
        goals: [ {
            start: "ab",
            end: "cc"
        }, {
            start: "acb",
            end: "ccc"
        }, {
            start: "cabadc",
            end: "ccbcdc"
        }, {
            start: "caaaaac",
            end: "ccabccc"
        } ]
    };
}
function ruleset_replace_2() {
    return {
        name: "Replace 2",
        rules: [ "a > b", "c > d" ],
        goals: [ {
            start: "ac",
            end: "bd"
        }, {
            start: "aca",
            end: "bdb"
        }, {
            start: "cabacd",
            end: "dbbbdd"
        }, {
            start: "caaaaac",
            end: "dbababd"
        } ]
    };
}
function ruleset_shrink_between() {
    return {
        name: "Shrink Between",
        rules: [ "a b a > a a" ],
        goals: [ {
            start: "aaaba",
            end: "aaaa"
        }, {
            start: "abaaaba",
            end: "aaaaa"
        }, {
            start: "abaabaaba",
            end: "aaaaaa"
        } ]
    };
}
function ruleset_grow_between() {
    return {
        name: "Grow Between",
        rules: [ "a a > a b a" ],
        goals: [ {
            start: "aaa",
            end: "aaba"
        }, {
            start: "aaaa",
            end: "abaaba"
        }, {
            start: "aaaaaa",
            end: "abaabaaba"
        } ]
    };
}
function ruleset_shrink_both_same() {
    return {
        name: "Shrink Both Same",
        rules: [ "a b a > b" ],
        goals: [ {
            start: "cabac",
            end: "cbc"
        }, {
            start: "aaabaaa",
            end: "aba"
        }, {
            start: "aaaaabaaaaa",
            end: "aba"
        } ]
    };
}
function ruleset_unary_equations() {
    return {
        name: "Unary Equations",
        rules: [ "= > 1 = 1" ],
        goals: [ {
            start: "1=1",
            end: "11=11"
        }, {
            start: "1=1",
            end: "111=111"
        }, {
            start: "1=1",
            end: "11111=11111"
        } ]
    };
}
function ruleset_shrink_triple() {
    return {
        name: "Shrink Triple",
        rules: [ "a a a > a" ],
        goals: [ {
            start: "aaa",
            end: "a"
        }, {
            start: "aaaaa",
            end: "a"
        }, {
            start: "aaaaaaa",
            end: "a"
        } ]
    };
}
function ruleset_grow_triple() {
    return {
        name: "Grow Triple",
        rules: [ "a > a a a" ],
        goals: [ {
            start: "a",
            end: "aaa"
        }, {
            start: "a",
            end: "aaaaa"
        }, {
            start: "a",
            end: "aaaaaaa"
        } ]
    };
}
function ruleset_swap_change_left() {
    return {
        name: "Swap Change Left",
        rules: [ "b c > a b" ],
        goals: [ {
            start: "bcc",
            end: "aab"
        }, {
            start: "bcbcbc",
            end: "bcbcab"
        }, {
            start: "bcbcabbc",
            end: "abababab"
        }, {
            start: "bcccc",
            end: "aaaab"
        }, {
            start: "abbcabbcbcbc",
            end: "abababababab"
        } ]
    };
}
function ruleset_swap_change_right() {
    return {
        name: "Swap Change Right",
        rules: [ "a b > b c" ],
        goals: [ {
            start: "aab",
            end: "bcc"
        }, {
            start: "ababab",
            end: "ababbc"
        }, {
            start: "abababab",
            end: "bcbcabbc"
        }, {
            start: "aaaab",
            end: "bcccc"
        }, {
            start: "abababababab",
            end: "abbcabbcbcbc"
        } ]
    };
}
function ruleset_right_change() {
    return {
        name: "Right Change",
        rules: [ "a b > a c" ],
        goals: [ {
            start: "ababab",
            end: "ababac"
        }, {
            start: "ababab",
            end: "acabac"
        }, {
            start: "abaabaaabaaaab",
            end: "acaacaaacaaaac"
        } ]
    };
}
function ruleset_replace_left_same() {
    return {
        name: "Replace Left Same",
        rules: [ "b a > a a" ],
        goals: [ {
            start: "bababa",
            end: "baaaba"
        }, {
            start: "baba",
            end: "aaaa"
        }, {
            start: "baabaaba",
            end: "aaaaaaaa"
        } ]
    };
}
function ruleset_replace_right_same() {
    return {
        name: "Replace Right Same",
        rules: [ "a b > a a" ],
        goals: [ {
            start: "ababab",
            end: "abaaab"
        }, {
            start: "abab",
            end: "aaaa"
        }, {
            start: "abaabaab",
            end: "aaaaaaaa"
        } ]
    };
}
function ruleset_same_replace_left() {
    return {
        name: "Same Replace Left",
        rules: [ "a a > b a" ],
        goals: [ {
            start: "aaaa",
            end: "abaa"
        }, {
            start: "aaaa",
            end: "baba"
        }, {
            start: "aaaaaaaa",
            end: "baabaaba"
        } ]
    };
}
function ruleset_same_replace_right() {
    return {
        name: "Same Replace Right",
        rules: [ "a a > a b" ],
        goals: [ {
            start: "aaaa",
            end: "aaba"
        }, {
            start: "aaaa",
            end: "abab"
        }, {
            start: "aaaaaaaa",
            end: "abaabaab"
        } ]
    };
}
function ruleset_swap() {
    return {
        name: "Swap",
        why: "Move a to the right.",
        rules: [ "a b > b a" ],
        goals: [ {
            start: "abb",
            end: "bba"
        }, {
            start: "abbbb",
            end: "bbbba"
        }, {
            start: "abbabb",
            end: "bbbbaa"
        } ]
    };
}
function ruleset_shrink_left() {
    return {
        name: "Shrink left",
        why: "Remove b's before a's.",
        rules: [ "b a > a" ],
        goals: [ {
            start: "bba",
            end: "a"
        }, {
            start: "babba",
            end: "aa"
        }, {
            start: "bbbabba",
            end: "aa"
        }, {
            start: "bbbabbaba",
            end: "aaa"
        } ]
    };
}
function ruleset_shrink_right() {
    return {
        name: "Shrink right",
        why: "Remove b's after a's.",
        rules: [ "a b > a" ],
        goals: [ {
            start: "abb",
            end: "a"
        }, {
            start: "abbab",
            end: "aa"
        }, {
            start: "abbabbb",
            end: "aa"
        }, {
            start: "ababbabbb",
            end: "aaa"
        } ]
    };
}
function ruleset_grow_left() {
    return {
        name: "Grow left",
        why: "Insert b's before a's.",
        rules: [ "a > b a" ],
        goals: [ {
            start: "a",
            end: "bba"
        }, {
            start: "aa",
            end: "babba"
        }, {
            start: "aa",
            end: "bbbabba"
        }, {
            start: "aaa",
            end: "bbbabbaba"
        } ]
    };
}
function ruleset_grow_right() {
    return {
        name: "Grow right",
        why: "Insert b's after a's.",
        rules: [ "a > a b" ],
        goals: [ {
            start: "a",
            end: "abb"
        }, {
            start: "aa",
            end: "abbab"
        }, {
            start: "aa",
            end: "abbabbb"
        }, {
            start: "aaa",
            end: "ababbabbb"
        } ]
    };
}
function ruleset_half() {
    return {
        name: "Half",
        why: "Shorten a string by removing the same letter.",
        rules: [ "a a > a" ],
        goals: [ {
            start: "aa",
            end: "a"
        }, {
            start: "aaaa",
            end: "a"
        }, {
            start: "aaaaaaa",
            end: "aaa"
        } ]
    };
}
function ruleset_double() {
    return {
        name: "Double",
        why: "Lengthen a string by adding the same letter.",
        rules: [ "a > a a" ],
        goals: [ {
            start: "a",
            end: "aaa"
        }, {
            start: "a",
            end: "aaaa"
        }, {
            start: "a",
            end: "aaaaaaa"
        } ]
    };
}
function ruleset_shrink_different() {
    return {
        name: "Shrink Different",
        why: "Shorten a string by removing different letters.",
        rules: [ "b c > a" ],
        goals: [ {
            start: "bc",
            end: "a"
        }, {
            start: "bcbc",
            end: "aa"
        }, {
            start: "bcbcbcbc",
            end: "aaaa"
        } ]
    };
}
function ruleset_grow_different() {
    return {
        name: "Grow Different",
        why: "Lengthen a string by adding different letters.",
        rules: [ "a > b c" ],
        goals: [ {
            start: "a",
            end: "bc"
        }, {
            start: "aa",
            end: "bcbc"
        }, {
            start: "aaaa",
            end: "bcbcbcbc"
        } ]
    };
}
function ruleset_replace() {
    return {
        name: "Replace",
        why: "Learn the basics of rules, and how you can apply rules to symbols in any order.",
        rules: [ "a > b" ],
        goals: [ {
            start: "a",
            end: "b"
        }, {
            start: "aa",
            end: "bb"
        }, {
            start: "aaa",
            end: "bbb"
        }, {
            start: "aaaa",
            end: "abba"
        }, {
            start: "aaaaaaa",
            end: "abababa"
        } ]
    };
}

/*
 Return an array of replacer objects.

 Each of these replacer_rule function takes no parameters, and returns a
 "replacer object" containing:
    name: human readable name string.
    rules: array of string replacement operations, like "a > bb".
    goals: array of "goal objects" with start and end strings.
*/
function replacer_rule_sets() {
    return [ruleset_words, ruleset_regexDFA, ruleset_regexNFA, ruleset_CFG, ruleset_TM, ruleset_NTM, ruleset_replace, ruleset_grow_different, ruleset_shrink_different, ruleset_double, ruleset_half, ruleset_grow_right, ruleset_grow_left, ruleset_shrink_right, ruleset_shrink_left, ruleset_swap, ruleset_same_replace_right, ruleset_same_replace_left, ruleset_replace_right_same, ruleset_replace_left_same, ruleset_right_change, ruleset_swap_change_right, ruleset_swap_change_left, ruleset_grow_triple, ruleset_shrink_triple, ruleset_unary_equations, ruleset_shrink_both_same, ruleset_grow_between, ruleset_shrink_between, ruleset_replace_2, ruleset_replace_flow, ruleset_grow_different_2, ruleset_shrink_different_2, ruleset_swap_3, ruleset_expand_collapse, ruleset_grow_left_pair_change_right, ruleset_shrink_left_pair_replace_right_same, ruleset_unary_equations_adding, ruleset_binary_counting_prepare_1, ruleset_binary_counting_prepare_2, ruleset_binary_counting, ruleset_three_different_grow_same, ruleset_shrink_same_three_different, ruleset_two_different_grow_same, ruleset_grow_same_three_different, ruleset_unary_to_binary_equations_preparation, ruleset_unary_to_binary_equations ];
}

// ==========================================
// 2. STATE & STORAGE MANAGEMENT
// ==========================================

const AppState = {
    get: (key, fallback) => {
        try {
            const val = localStorage.getItem(`replacer_${key}`);
            return val !== null ? JSON.parse(val).value : fallback;
        } catch (e) {
            return fallback;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(`replacer_${key}`, JSON.stringify({ value }));
        } catch (e) {
            console.warn("localStorage not available");
        }
    },
    // Context-specific state helpers
    getGoalIndex: () => AppState.get('goal_index', 0),
    getRuleSetIndex: () => AppState.get('rule_set_index', 0),
    getFontSize: () => AppState.get('font_size', 20),
    setFontSize: (size) => {
        AppState.set('font_size', size);
        document.documentElement.style.fontSize = `${size}px`;
    }
};

// ==========================================
// 3. DOM UTILITIES
// ==========================================

// Drastically simplified DOM element creation
function createElement(tag, parent, text = '', styles = {}) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    Object.assign(el.style, styles);
    if (parent) parent.appendChild(el);
    return el;
}

// Creates both UI menu buttons and rules or symbols
function createButton(parent, text, onClick, styles = {}) {
    const btn = createElement('button', parent, text, {
        padding: '0.3em 0.5em',
        borderRadius: '0.5em',
        marginRight: '0.2em', marginBottom: '0.5em', 
        border: 'none',
        cursor: 'pointer',
        fontSize: 'inherit',
        ...styles
    });
    btn.addEventListener('click', onClick);
    return btn;
}

// Clears a container before re-rendering
function clearDOM(element) {
    element.innerHTML = '';
}

// Basic screen router
function navigateTo(context, screenFn) {
    clearDOM(document.body);
    const root = createElement('div', document.body, '', { padding: '1em' });
    context.root = root;
    screenFn(context);
}

// ==========================================
// 4. ANIMATION ENGINE (FLIP technique)
// ==========================================

// Helper to pause execution for animations
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Animates elements moving from their old bounds to their new bounds
async function animateMovement(elements, oldBoundsList, duration = 200) {
    elements.forEach(el => { el.style.transition = ''; }); // Clear old transitions
    
    // Invert phase
    const inverts = elements.map((el, i) => {
        const newBounds = el.getBoundingClientRect();
        const oldBounds = oldBoundsList[i];
        return {
            x: oldBounds.left - newBounds.left,
            y: oldBounds.top - newBounds.top
        };
    });

    // Apply translation instantly (without transition)
    elements.forEach((el, i) => {
        el.style.transform = `translate(${inverts[i].x}px, ${inverts[i].y}px)`;
    });

    // Force a browser reflow so the instant transform takes effect
    elements[0]?.offsetWidth; 

    // Play phase
    elements.forEach(el => {
        el.style.transition = `transform ${duration}ms ease`;
        el.style.transform = `translate(0, 0)`;
    });

    await sleep(duration);
    elements.forEach(el => {
        el.style.transition = '';
        el.style.transform = '';
    });
}

// ==========================================
// 5. SCREENS
// ==========================================

// Return the root DOM element for this context, after rendering the HTML header
function renderHeader(context, withHome=1, withSettings=0) {
    const root = context.root;
    createElement('h1', context.root, `String Replacer`, { });
    if (withHome) {
        createButton(root, "🏠 Home", () => navigateTo(context, renderHomeScreen));
    }
    if (withSettings) {
        createButton(root, "⚙️ Settings", () => navigateTo(context, renderSettingsScreen), { width: '100%' });
    }
    return root;
}

function renderHomeScreen(context) {
    let root = renderHeader(context,0,1);
    
    const ruleSets = replacer_rule_sets();
    ruleSets.forEach((ruleFn, i) => {
        let color = '#ffffff'; // assume untried 
        let state = ""; // optional check mark
        let win = AppState.get('rulewin_'+i);
        
        if (win==1) { // partial (active green-blue)
            color = '#30ff80'; 
            state = "⟳";
        }
        
        if (win==2) { // complete win, gray
            color = '#dadada';
            state = "✓";
        }
        const rule = ruleFn();
        createButton(root, `${i + 1}. ${rule.name} ${state}`, () => {
            AppState.set('rule_set_index', i);
            AppState.set('goal_index', 0);
            navigateTo(context, renderGoalsScreen);
        }, { display: 'block', width: '100%', backgroundColor: color });
    });
}

function renderSettingsScreen(context) {
    let root = renderHeader(context);
    
    createButton(root, "🗚 Font size larger", () => AppState.setFontSize(AppState.getFontSize() * 1.1), { display: 'block', marginBottom: '0.5em' });
    createButton(root, "🗛 Font size smaller", () => AppState.setFontSize(AppState.getFontSize() / 1.1), { display: 'block' });
}


// Make DOM elements to display the current ruleset.
//   Returns the ruleSet object
function rulesetHeader(context)
{
    const ruleSetFn = replacer_rule_sets()[AppState.getRuleSetIndex()];
    const ruleSet = ruleSetFn();
    createElement('p', context.root, `Rule set: ${ruleSet.name}`, { fontWeight: 'bold' });
    if (ruleSet.why) createElement('p', context.root, `Rationale: ${ruleSet.why}`);
    
    return ruleSet;
}

function renderGoalsScreen(context) {
    let root = renderHeader(context);    
    var ruleSet = rulesetHeader(context);
    
    ruleSet.goals.forEach((goal, i) => {
        let color = '#dadada';
        createButton(root, `${i + 1}. ${goal.start} ➜ ${goal.end}`, () => {
            AppState.set('goal_index', i);
            navigateTo(context, renderGameScreen);
        }, { display: 'block', width: '100%', backgroundColor: color });
    });
}

// ==========================================
// MAIN GAME LOGIC (Updated with Visual Stack History)
// ==========================================

function renderGameScreen(context) {
    let root = renderHeader(context);
    createButton(root, "Goals", () => navigateTo(context, renderGoalsScreen));
    createButton(root, "Reset Symbols", () => navigateTo(context, renderGameScreen));

    // Load State
    const ruleSet = rulesetHeader(context);
    const goal = ruleSet.goals[AppState.getGoalIndex()];
        
    createElement('p', root, `Goal: ${goal.end}`, { color: '#333' });
    
    // Dedicated UI Containers to preserve visual order
    const rulesContainer = createElement('div', root, '', { marginBottom: '1em' });
    const symbolsContainer = createElement('div', root, '', { marginBottom: '1em' });
    const historyContainer = createElement('div', root, '', { marginBottom: '1em' });
    const winContainer = createElement('div', root);
    
    // Game State
    let currentList = goal.start.split('');
    let selectedRuleIndex = 0; 
    let isSuccess = false;
    
    // History Tracking Array: Stores the initial state to start
    let history = [{ state: goal.start, ruleApplied: null }];

    const parsedRules = ruleSet.rules.map(r => {
        //const parts = r.split(' ');
        const parts = r.replace(/\s+/g, '').split(""); // remove spaces, and split chars into an array
        const pivot = parts.indexOf('>');
        return { left: parts.slice(0, pivot), right: parts.slice(pivot + 1), original: r };
    });

    const isRuleValidAt = (rule, index) => {
        if (index + rule.left.length > currentList.length) return false;
        return rule.left.every((sym, i) => sym === currentList[index + i]);
    };

    // The main render loop
    async function refresh() {
        clearDOM(rulesContainer);
        clearDOM(symbolsContainer);
        clearDOM(historyContainer);
        clearDOM(winContainer);
        
        isSuccess = (currentList.join('') === goal.end);

        // --- 1. RENDER HISTORY (Visual Stack: Newest to Oldest) ---
        if (history.length > 1) {
            //createElement('p', historyContainer, 'Path:', { margin: '0 0 0.5em 0', fontWeight: 'bold' });
            
            // Get all past states and reverse them (newest top, oldest bottom)
            const previousStates = history.slice(0, -1).reverse();
            
            previousStates.forEach((step, i) => {
                // To show the rule that got us out of this step, we look at the chronologically *next* step
                const nextStep = history[history.length - 1 - i];
                const ruleText = nextStep.ruleApplied;

                const rowContainer = createElement('div', historyContainer, '', { 
                    marginBottom: '0.5em',
                    display: 'flex',
                    alignItems: 'center'
                });

                // Render the symbols as inactive boxes to match the current symbols
                step.state.split('').forEach(symbol => {
                    createButton(rowContainer, symbol, () => {}, {
                        backgroundColor: '#e6e6e6', // Muted background
                        color: '#777', // Muted text
                        cursor: 'default',
                    });
                });

                // Show the rule applied next to the row
                if (ruleText) {
                    createElement('span', rowContainer, `(${ruleText})`, { 
                        color: '#888', 
                        marginLeft: '0.5em' 
                    });
                }
            });
        }

        // --- 2. RENDER FINAL WIN STATE ---
        if (isSuccess) {
            createElement('p', symbolsContainer, 'Final Symbols:');
            // Render inactive symbols so they don't jump off screen
            currentList.forEach(symbol => {
                createButton(symbolsContainer, symbol, () => {}, {
                    backgroundColor: '#00b400',
                    color: 'white',
                    cursor: 'default'
                });
            });
            renderSuccessState();
            return; // Halt here so rules aren't redrawn
        }

        // --- 3. RENDER ACTIVE GAME STATE (Rules & Symbols) ---
        createElement('p', rulesContainer, 'Rules:');
        parsedRules.forEach((rule, i) => {
            const isSelected = i === selectedRuleIndex;
            createButton(rulesContainer, `${rule.left.join('')} ➜ ${rule.right.join('')}`, () => {
                selectedRuleIndex = i;
                refresh();
            }, {
                backgroundColor: isSelected ? 'lightgreen' : '#dadada'
            });
        });

        createElement('p', symbolsContainer, 'Current Symbols:');
        currentList.forEach((symbol, index) => {
            const rule = parsedRules[selectedRuleIndex];
            const valid = rule && isRuleValidAt(rule, index);
            
            createButton(symbolsContainer, symbol, async () => {
                if (valid) await applyRule(rule, index);
            }, {
                backgroundColor: valid ? '#00b400' : '#dadada',
                color: valid ? 'white' : 'black'
            });
        });

        // Rule Application & Animation
        async function applyRule(rule, index) {
            const trailingStartIndex = index + rule.left.length;
            const trailingElements = Array.from(symbolsContainer.children).slice(trailingStartIndex + 1); 
            const oldBounds = trailingElements.map(el => el.getBoundingClientRect());

            const before = currentList.slice(0, index);
            const after = currentList.slice(trailingStartIndex);
            currentList = [...before, ...rule.right, ...after];
            
            // Push the new state and the rule formatting to our history buffer
            history.push({ 
                state: currentList.join(''), 
                ruleApplied: `${rule.left.join('')} ➜ ${rule.right.join('')}` 
            });
            
            refresh(); 
            
            const newTrailingElements = Array.from(symbolsContainer.children).slice(index + rule.right.length + 1);
            if (newTrailingElements.length > 0 && oldBounds.length > 0) {
                await animateMovement(newTrailingElements, oldBounds, 200);
            }
        }
    }

    function renderSuccessState() {
        const successDiv = createElement('div', winContainer, '', { 
            backgroundColor: 'lightgreen', 
            padding: '1em', 
            borderRadius: '0.5em', 
            textAlign: 'center',
            marginTop: '1em' 
        });
        createElement('span', successDiv, '✅ 🎉 🏆', { display: 'block' });
        createElement('strong', successDiv, 'Success! Well done!', { display: 'block', margin: '0.5em 0' });

        createButton(successDiv, "➡️ Next Goal", () => {
            const ruleCur = AppState.getRuleSetIndex();
            let nextGoal = AppState.getGoalIndex() + 1;
            if (nextGoal >= ruleSet.goals.length) { // last one, go to next
                AppState.set('rulewin_'+ruleCur,2);
                AppState.set('rule_set_index', ruleCur + 1);
                AppState.set('goal_index', 0);
            } else {
                AppState.set('rulewin_'+ruleCur,1);
                AppState.set('goal_index', nextGoal);
            }
            navigateTo(context, renderGameScreen);
        }, { width: '100%', backgroundColor: '#fff', padding: '0.8em', fontWeight: 'bold' });
    }

    refresh();
}

// ==========================================
// 7. INITIALIZATION
// ==========================================

function initApp() {
    // Setup basic document styles
    document.head.appendChild(createElement('meta', null, '', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }));
    document.body.style.fontFamily = '"Roboto", Arial, sans-serif';
    AppState.setFontSize(AppState.getFontSize()); // Apply saved font size

    const context = {};
    navigateTo(context, renderHomeScreen);
}

// Boot the app
initApp();

