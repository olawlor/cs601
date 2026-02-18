/*
Example recursive descent compiler frontend:
    - Lexer that tokenizes the (string) input
    - Parser that builds an abstract syntax tree (set of objects)
    - IR Generator that emits LLVM IR code

Vibecoded by Dr. Orion Lawlor and Gemini-3 Thinking 2026-02-17 (Public Domain)
*/

// Types of tokens in our language.  Interface between lexer and parser.
const TokenType = {
  EOF: 0,
  
  FUNCTION: 1, // keywords
  VAR: 2,
  RETURN: 3,
  
  IDENTIFIER: 4, // generic string-ish thing
  NUMBER: 5,
  
  EQUALS: 6,
  PLUS: 7,
  LPAREN: 8,  // (
  RPAREN: 9,  // )
  LBRACE: 10, // {
  RBRACE: 11, // }
  SEMICOLON: 12,
  COMMA: 13
};

// Map keywords to their types for easy lookup
const KEYWORDS = {
  'function': TokenType.FUNCTION,
  'var': TokenType.VAR,
  'return': TokenType.RETURN
};

/*
Lexer: emit a string of token structs (with type and value fields).
*/
class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.currentChar = this.input[this.pos];
    this.lookahead = null; // We'll store the "peeked" token here
  }

  // Move the pointer forward
  advance() {
    this.pos++;
    this.currentChar = (this.pos < this.input.length) ? this.input[this.pos] : null;
  }

  // Skip whitespace
  skipWhitespace() {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  // Helper to read identifiers or keywords
  readIdentifier() {
    let result = '';
    while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  // Helper to read numbers
  readNumber() {
    let result = '';
    while (this.currentChar && /[0-9]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return parseInt(result);
  }

  /**
   * THE ENGINE: gets the next token from the string
   */
  getNextToken() {
    this.skipWhitespace();

    if (!this.currentChar) return { type: TokenType.EOF, value: null };

    // 1. Identifiers and Keywords
    if (/[a-zA-Z_]/.test(this.currentChar)) {
      const value = this.readIdentifier();
      // value might be a keyword, or a random variable or function name
      const type = KEYWORDS[value] || TokenType.IDENTIFIER;
      return { type, value };
    }

    // 2. Numbers
    if (/[0-9]/.test(this.currentChar)) {
      return { type: TokenType.NUMBER, value: this.readNumber() };
    }

    // 3. Single-character operators/punctuation
    const char = this.currentChar;
    this.advance();

    switch (char) {
      case '=': return { type: TokenType.EQUALS, value: '=' };
      case '+': return { type: TokenType.PLUS, value: '+' };
      case '(': return { type: TokenType.LPAREN, value: '(' };
      case ')': return { type: TokenType.RPAREN, value: ')' };
      case '{': return { type: TokenType.LBRACE, value: '{' };
      case '}': return { type: TokenType.RBRACE, value: '}' };
      case ';': return { type: TokenType.SEMICOLON, value: ';' };
      case ',': return { type: TokenType.COMMA, value: ',' };
      default: throw new Error(`Unknown character: ${char}`);
    }
  }

  /**
   * THE PARSER'S TOOLS: peek() and next()
   */
  peek() {
    if (!this.lookahead) {
      this.lookahead = this.getNextToken();
    }
    return this.lookahead;
  }

  next() {
    if (this.lookahead) {
      const token = this.lookahead;
      this.lookahead = null;
      return token;
    }
    return this.getNextToken();
  }
}


/* 
Parser: builds an abstract syntax tree in the ESTree / ESLint format.
*/
class Parser {
  constructor(lexer) {
    this.lexer = lexer;
  }

  // Helper to verify and consume a token
  eat(expectedType) {
    const token = this.lexer.next();
    if (token.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType} but got ${token.type} ("${token.value}")`);
    }
    return token;
  }

  parse() {
    return this.parseProgram();
  }

  // Program : Statement*
  parseProgram() {
    const body = [];
    while (this.lexer.peek().type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }
  
  // A statement is a function, variable declaration, or return statement.
  parseStatement() {
    const token = this.lexer.peek();

    switch (token.type) {
      case TokenType.FUNCTION:
        return this.parseFunctionDeclaration();
      case TokenType.VAR:
        return this.parseVariableDeclaration();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        throw new Error(`Unexpected token at start of statement: ${token.value}`);
    }
  }

  // FUNCTION = function name(arg *) BLOCK
  parseFunctionDeclaration() {
    this.eat(TokenType.FUNCTION);
    const id = this.eat(TokenType.IDENTIFIER).value;
    
    this.eat(TokenType.LPAREN);
    const params = [];
    if (this.lexer.peek().type !== TokenType.RPAREN) {
      params.push(this.eat(TokenType.IDENTIFIER).value);
      while (this.lexer.peek().type === TokenType.COMMA) {
        this.eat(TokenType.COMMA);
        params.push(this.eat(TokenType.IDENTIFIER).value);
      }
    }
    this.eat(TokenType.RPAREN);

    const body = this.parseBlock();

    return { type: 'FunctionDeclaration', id, params, body };
  }

  // { Statement* }
  parseBlock() {
    this.eat(TokenType.LBRACE);
    const body = [];
    while (this.lexer.peek().type !== TokenType.RBRACE) {
      body.push(this.parseStatement());
    }
    this.eat(TokenType.RBRACE);
    return { type: 'BlockStatement', body };
  }
  
  // var name = value;
  parseVariableDeclaration() {
    this.eat(TokenType.VAR);
    const id = this.eat(TokenType.IDENTIFIER).value;
    this.eat(TokenType.EQUALS);
    const init = this.parseExpression(); // Descent into expressions
    this.eat(TokenType.SEMICOLON);

    return { type: 'VariableDeclaration', id, init };
  }

  // return value;
  parseReturnStatement() {
    this.eat(TokenType.RETURN);
    const argument = this.parseExpression();
    this.eat(TokenType.SEMICOLON);
    return { type: 'ReturnStatement', argument };
  }

  // A generic expression, with infix operators.
  // For "x + 3", we look for an identifier/number, then check for a "+"
  parseExpression() {
    let left = this.parsePrimary();

    if (this.lexer.peek().type === TokenType.PLUS) {
      this.eat(TokenType.PLUS);
      const right = this.parsePrimary();
      left = {
        type: 'BinaryExpression',
        operator: '+',
        left,
        right
      };
    }
    return left;
  }

  // A base value like a variable reference or constant
  parsePrimary() {
    const token = this.lexer.next();
    if (token.type === TokenType.IDENTIFIER) {
      return { type: 'Identifier', name: token.value };
    } else if (token.type === TokenType.NUMBER) {
      return { type: 'Literal', value: token.value };
    }
    throw new Error("Expected an identifier or a number");
  }
  
}




// A simple scope/symbol table, links variable names to LLVM IR register addresses
class SymbolTable {
  constructor(parent = null) {
    this.symbols = new Map(); // name -> %register_address
    this.parent = parent;
  }
  
  set(name, address) { this.symbols.set(name, address); }
  get(name) {
    return this.symbols.get(name) || (this.parent ? this.parent.get(name) : null);
  }
}


//  Emit LLVM IR (.ll format, in ASCII) from a parsed tree.
class IRGenerator {
  constructor() {
    this.regCount = 1; //<- subtle: %0 is the start label
    this.output = [];
    this.symbols = new SymbolTable();
  }

  newReg() { return `%${this.regCount++}`; }

  emit(line) { this.output.push("  " + line); }

  generate(node) {
    switch (node.type) {
      case 'Program':
        node.body.forEach(n => this.generate(n));
        return this.output.join('\n');

      case 'FunctionDeclaration':  // Create the function declaration, including curly braces
        this.symbols = new SymbolTable(this.symbols); // New scope
        this.output.push(`define i32 @${node.id}(${node.params.map(p => `i32 %arg_${p}`).join(', ')}) {`);
        
        // Move arguments to the stack so they are mutable
        node.params.forEach(p => {
          const reg = this.newReg();
          this.emit(`${reg} = alloca i32`);
          this.emit(`store i32 %arg_${p}, ptr ${reg}`);
          this.symbols.set(p, reg); // Map 'x' to its stack pointer
        });

        this.generate(node.body);
        this.output.push('}\n');
        this.symbols = this.symbols.parent; // Pop scope
        break;

      case 'BlockStatement': // A block just recurses to its statements
        node.body.forEach(n => this.generate(n));
        break;

      case 'VariableDeclaration': // Variable declaration: alloca space and store there
        const valReg = this.generate(node.init); // Generate code for the expression
        const ptrReg = this.newReg();
        this.emit(`${ptrReg} = alloca i32`);
        this.emit(`store i32 ${valReg}, ptr ${ptrReg}`);
        this.symbols.set(node.id, ptrReg);
        break;

      case 'BinaryExpression': // Only kind of binary expression so far: addition
        const left = this.generate(node.left);
        const right = this.generate(node.right);
        const res = this.newReg();
        this.emit(`${res} = add i32 ${left}, ${right}`);
        return res;

      case 'Identifier': // Variable reference: load value
        const addr = this.symbols.get(node.name);
        const loadReg = this.newReg();
        this.emit(`${loadReg} = load i32, ptr ${addr}`);
        return loadReg;

      case 'Literal': // Just a constant
        return node.value;

      case 'ReturnStatement': 
        const retVal = this.generate(node.argument);
        this.emit(`ret i32 ${retVal}`);
        break;
    }
  }
}



/*
 Test: 
*/
if (1) {
   var sourcecode = "function foo(x) { var y = x+3; return y; }";
   var lexer = new Lexer(sourcecode);
   var parser = new Parser(lexer);
   var program = parser.parse();
   
   var irgen = new IRGenerator();
   var IR = irgen.generate(program);
   
   console.log(IR);
}


