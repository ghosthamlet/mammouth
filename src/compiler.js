mammouth.VERSION = '0.1.4';
mammouth.compile = function(code) {
	Tokens = mammouth.Tokens;
	FunctionInAssignment = function(seq) {
		var r = Tokens.FunctionToken + ' ';
		r += seq.left.name;
		var arguments = '(';
		for (var i = 0; i < seq.right.params.length; i++) {
			if( i != 0 ) {
				arguments += ', '
			}
			arguments += evalStatement(seq.right.params[i]);
		};
		arguments += ')';
		r += arguments;
		r += ' {';
		var body = '';
		for(var j = 0; j < seq.right.body.length; j++) {
			if(typeof seq.right.body[j] == 'undefined') {
				body += '\n';
			} else {
				seq.right.body[j].only = true;
				if(typeof seq.right.body[j] == 'string') {
					body += evalStatement(seq.right.body[j]);
				} else {
					body += evalStatement(seq.right.body[j]) + '\n';
				}
			}
		}
		var pars = mammouth.LineTerminatorParser.parse(body);
		for(var x = 0; x < pars.length; x++) {
			if(pars[x] != '' || x == 0) {
				if(x == (pars.length - 1)) {
					r += '\t' + pars[x];
				} else {
					if(seq.right.body.length == 1) {
						r += '\t' + pars[x];
					} else {
						r += '\t' + pars[x] + '\n';
					}
				}
			} else if(typeof pars[x] == 'undefined') {
				r += '\n';
			} else {
				r += pars[x];
			}
		}
		r += '}';
		return r + ';';
	};
	evalStatement = function(seq) {
		if(typeof seq == 'string') {
			return seq;
		}
		if(seq == null) {
			return '';
		}
		switch(seq.type) {
			case 'embed':
				return seq.content;
			case 'block':
				var r = '<?php \n';
				for(var i = 0; i < seq.elements.length; i++) {
					if(typeof seq.elements[i] == 'undefined') {
						r += '\n';
					} else {
						seq.elements[i].only = true;
						if(typeof seq.elements[i] == 'string') {
							r += evalStatement(seq.elements[i]);
						} else {
							r += evalStatement(seq.elements[i]) + '\n';
						}
					}
				}
				return r + '?>';
			case 'blockwithoutbra':
				var r = '';
				for(var i = 0; i < seq.elements.length; i++) {
					if(typeof seq.elements[i] == 'undefined') {
						r += '\n';
					} else {
						seq.elements[i].only = true;
						if(typeof seq.elements[i] == 'string') {
							r += evalStatement(seq.elements[i]);
						} else {
							r += evalStatement(seq.elements[i]) + '\n';
						}
					}
				}
				return r;
			case 'NumericLiteral':
				var r = seq.value;
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'BooleanLiteral':
				var r = seq.value;
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'StringLiteral':
				var r = "'" + seq.value + "'";
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'ArrayLiteral':
				var r = 'array(';
				var elements = '';
				if(seq.elements != '') {
					for (var i = 0; i < seq.elements.length; i++) {
						if( i != 0 ) {
							elements += ', '
						}
						elements += evalStatement(seq.elements[i]);
					};
				}
				r += elements + ')'; 
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'EODLiteral':
				r = '<<<EOD' + '\n';
				r += seq.value +'\n';
				r += 'EOD';
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'EOTLiteral':
				r = '<<<EOT' + '\n';
				r += seq.value +'\n';
				r += 'EOT';
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'Variable':
				var r = '$' + evalStatement(seq.name);
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'ReferenceVariable':
				var r = '&$' + evalStatement(seq.name);
				return r;
			case 'PropertyAccess':
				var b = evalStatement(seq.base);
				var n, r;
				if(typeof seq.name == 'string') {
					n = seq.name;
					r = b + '->' + n;
				} else {
					n = '[' + evalStatement(seq.name) + ']'
					r = b + n;
				} 
				if(seq.only==true) {
					r += ';';
				}
				return r;
			case 'NewOperator':
				var r = Tokens.NewToken;
				var constructor = evalStatement(seq.constructor);
				var arguments = '(';
				for (var i = 0; i < seq.arguments.length; i++) {
					if( i != 0 ) {
						arguments += ', '
					}
					arguments += evalStatement(seq.arguments[i]);
				};
				arguments += ')';
				r += ' ' + constructor + arguments;
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'BinaryExpression':
				if(seq.left.type == 'BinaryExpression') {
					seq.left.Parentheses = true;
				}
				var left = evalStatement(seq.left);
				if(seq.right.type == 'BinaryExpression') {
					seq.right.Parentheses = true;
				}
				var right = evalStatement(seq.right);
				var operator = ' ' + seq.operator + ' ';
				var r = left + operator + right;
				if(seq.Parentheses == true) {
					r = '(' + r;
					r += ')';
				}
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'PostfixExpression':
				if(seq.expression.type == 'BinaryExpression') {
					seq.expression.Parentheses = true;
				}
				var expression = evalStatement(seq.expression);
				var operator = seq.operator;
				var r = expression + operator;
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'UnaryExpression':
				if(seq.expression.type == 'BinaryExpression') {
					seq.expression.Parentheses = true;
				}
				var expression = evalStatement(seq.expression);
				var operator = seq.operator;
				var r = operator + expression;
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'AssignmentExpression':
				if(seq.right.type == 'Function') {
					var r = FunctionInAssignment(seq);
					return r;
				}
				var left = evalStatement(seq.left);
				var right = evalStatement(seq.right);
				var operator = ' ' + seq.operator + ' ';
				var r = left + operator + right;
				if(seq.Parentheses == true) {
					r = '(' + r;
					r += ')';
				}
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'AssignmentExpressionOfFunction':
				var left = evalStatement(seq.left);
				var right = evalStatement(seq.right);
				var operator = ' ' + seq.operator + ' ';
				var r = left + operator + right;
				if(seq.Parentheses == true) {
					r = '(' + r;
					r += ')';
				}
				return r;
			case 'ConditionalExpression':
				if(seq.condition.type == 'BinaryExpression') {
					seq.condition.Parentheses = true;
				}
				var condition = evalStatement(seq.condition);
				var trueExpression = evalStatement(seq.trueExpression);
				var falseExpression = evalStatement(seq.falseExpression);
				var r = condition + ' ? ' + trueExpression + ' : ' + falseExpression; 
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'break':
				var r = 'break'
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'FunctionCall':
				var name;
				if(seq.name.type == 'PropertyAccess') {
					name = evalStatement(seq.name);
				} else {
					name = evalStatement(seq.name.name);
				}
				var arguments = '(';
				for (var i = 0; i < seq.arguments.length; i++) {
					if( i != 0 ) {
						arguments += ', '
					}
					arguments += evalStatement(seq.arguments[i]);
				};
				arguments += ')';
				r = name + arguments;
				if(seq.only == true) {
					r += ';';
				}
				return r;
			case 'IfStatement':
				var r = Tokens.IfToken;
				var condition = '(';
				condition += evalStatement(seq.condition);
				condition += ')';
				r += condition;
				r += ' {';
				var body = '';
				for(var j = 0; j < seq.ifStatement.length; j++) {
					if(typeof seq.ifStatement[j] == 'undefined') {
						body += '\n';
					} else {
						seq.ifStatement[j].only = true;
						if(typeof seq.ifStatement[j] == 'string') {
							body += evalStatement(seq.ifStatement[j]);
						} else {
							body += evalStatement(seq.ifStatement[j]) + '\n';
						}
					}
				}
				var pars = mammouth.LineTerminatorParser.parse(body);
				for(var x = 0; x < pars.length; x++) {
					if(pars[x] != '' || x == 0) {
						if(x == (pars.length - 1)) {
							r += '\t' + pars[x];
						} else {
							if(seq.ifStatement.length == 1) {
								r += '\t' + pars[x];
							} else {
								r += '\t' + pars[x] + '\n';
							}
						}
					} else if(typeof pars[x] == 'undefined') {
						r += '\n';
					} else {
						r += pars[x];
					}
				}
				r += '}';
				if(seq.elseifStatement != null) {
					for (var i = 0; i < seq.elseifStatement.length; i++) {
						r += ' ' + Tokens.ElseToken + Tokens.IfToken;
						condition = '(';
						condition += evalStatement(seq.elseifStatement[i].condition);
						condition += ')';
						r += condition;
						r += ' {';
						body = '';
						for(var j = 0; j < seq.elseifStatement[i].statement.length; j++) {
							if(typeof seq.elseifStatement[i].statement[j] == 'undefined') {
								body += '\n';
							} else {
								seq.elseifStatement[i].statement[j].only = true;
								if(typeof seq.elseifStatement[i][j] == 'string') {
									body += evalStatement(seq.elseifStatement[i].statement[j]);
								} else {
									body += evalStatement(seq.elseifStatement[i].statement[j]) + '\n';
								}
							}
						}
						var pars = mammouth.LineTerminatorParser.parse(body);
						for(var x = 0; x < pars.length; x++) {
							if(pars[x] != '' || x == 0) {
								if(x == (pars.length - 1)) {
									r += '\t' + pars[x];
								} else {
									if(seq.elseifStatement[i].statement.length == 1) {
										r += '\t' + pars[x];
									} else {
										r += '\t' + pars[x] + '\n';
									}
								}
							} else if(typeof pars[x] == 'undefined') {
								r += '\n';
							} else {
								r += pars[x];
							}
						}
						r += '}';
					};
				}
				if(seq.elseStatement != null) {
					r += ' else {';
					body = '';
					for(var j = 0; j < seq.elseStatement.length; j++) {
						if(typeof seq.elseStatement[j] == 'undefined') {
							body += '\n';
						} else {
							seq.elseStatement[j].only = true;
							if(typeof seq.elseStatement[j] == 'string') {
								body += evalStatement(seq.elseStatement[j]);
							} else {
								body += evalStatement(seq.elseStatement[j]) + '\n';
							}
						}
					}
					var pars = mammouth.LineTerminatorParser.parse(body);
					for(var x = 0; x < pars.length; x++) {
						if(pars[x] != '' || x == 0) {
							if(x == (pars.length - 1)) {
								r += '\t' + pars[x];
							} else {
								if(seq.elseStatement.length == 1) {
									r += '\t' + pars[x];
								} else {
									r += '\t' + pars[x] + '\n';
								}
							}
						} else if(typeof pars[x] == 'undefined') {
							r += '\n';
						} else {
							r += pars[x];
						}
					}
					r += '}';
				}
				return r;
			case 'ForStatement':
				var r = Tokens.ForToken + '(';
				if(seq.initializer.type == 'BinaryExpression') {
					if(seq.initializer.operator == 'of') {
						seq.test = {
							"type": "BinaryExpression",
							"operator": "<",
							"left": seq.initializer.left,
							"right": {
								"type": "FunctionCall",
								"name": {
									"type": "Variable",
									"name": "count"
								},
								"arguments": [
									seq.initializer.right
								]
							}
						};
						seq.counter = {
							"type": "PostfixExpression",
							"operator": "++",
							"expression": {
								"type": "Variable",
								"name": "_i"
							}
						};
						seq.statement.splice(1, 0, {
							"type": "AssignmentExpression",
							"operator": "=",
							"left": seq.initializer.left,
							"right": {
								"type": "PropertyAccess",
								"base": seq.initializer.right,
								"name": {
									"type": "Variable",
									"name": "_i"
								}
					         }
						});
						seq.initializer = {
							"type": "AssignmentExpression",
							"operator": "=",
							"left": {
									"type": "Variable",
									"name": "_i"
								},
							"right": {
								"type": "NumericLiteral",
								"value": 0
							}
						};
					}
				}
				r += evalStatement(seq.initializer) + '; ';
				r += evalStatement(seq.test) + '; ';
				r += evalStatement(seq.counter);
				r += ')';
				r += ' {';
				var body = '';
				for(var j = 0; j < seq.statement.length; j++) {
					if(typeof seq.statement[j] == 'undefined') {
						body += '\n';
					} else {
						seq.statement[j].only = true;
						if(typeof seq.statement[j] == 'string') {
							body += evalStatement(seq.statement[j]);
						} else {
							body += evalStatement(seq.statement[j]) + '\n';
						}
					}
				}
				var pars = mammouth.LineTerminatorParser.parse(body);
				for(var x = 0; x < pars.length; x++) {
					if(pars[x] != '' || x == 0) {
						if(x == (pars.length - 1)) {
							r += '\t' + pars[x];
						} else {
							if(seq.statement.length == 1) {
								r += '\t' + pars[x];
							} else {
								r += '\t' + pars[x] + '\n';
							}
						}
					} else if(typeof pars[x] == 'undefined') {
						r += '\n';
					} else {
						r += pars[x];
					}
				}
				r += '}';
				return r;
			case 'WhileStatement':
				var r = Tokens.WhileToken + '(';
				r += evalStatement(seq.condition);
				r += ')';
				r += ' {';
				var body = '';
				for(var j = 0; j < seq.statement.length; j++) {
					if(typeof seq.statement[j] == 'undefined') {
						body += '\n';
					} else {
						seq.statement[j].only = true;
						if(typeof seq.statement[j] == 'string') {
							body += evalStatement(seq.statement[j]);
						} else {
							body += evalStatement(seq.statement[j]) + '\n';
						}
					}
				}
				var pars = mammouth.LineTerminatorParser.parse(body);
				for(var x = 0; x < pars.length; x++) {
					if(pars[x] != '' || x == 0) {
						if(x == (pars.length - 1)) {
							r += '\t' + pars[x];
						} else {
							if(seq.statement.length == 1) {
								r += '\t' + pars[x];
							} else {
								r += '\t' + pars[x] + '\n';
							}
						}
					} else if(typeof pars[x] == 'undefined') {
						r += '\n';
					} else {
						r += pars[x];
					}
				}
				r += '}';
				return r;
			case 'SwitchStatement':
				var r = Tokens.SwitchToken + '(';
				r += evalStatement(seq.variable);
				r += ')';
				r += ' {\n';
				var CasesBlock = '';
				for(var i = 0; i < seq.cases.length; i++) {
					if(typeof seq.cases[i] != 'undefined') {
						if(seq.cases[i].type == 'case') {
							CasesBlock += Tokens.CaseToken + ' ' + evalStatement(seq.cases[i].value) + ':';
							if(seq.cases[i].statement != '') {
								seq.cases[i].statement.unshift(undefined);
								seq.cases[i].statement.push({
									type: 'break'
								})
								var body = '';
								for(var j = 0; j < seq.cases[i].statement.length; j++) {
									if(typeof seq.cases[i].statement[j] == 'undefined') {
										body += '\n';
									} else {
										seq.cases[i].statement[j].only = true;
										if(typeof seq.cases[i].statement[j] == 'string') {
											body += evalStatement(seq.cases[i].statement[j]);
										} else {
											body += evalStatement(seq.cases[i].statement[j]) + '\n';
										}
									}
								}
								var pars = mammouth.LineTerminatorParser.parse(body);
								for(var x = 0; x < pars.length; x++) {
									if(pars[x] != '' || x == 0) {
										if(x == (pars.length - 1)) {
											CasesBlock += '\t' + pars[x];
										} else {
											if(seq.cases[i].statement.length == 1) {
												CasesBlock += '\t' + pars[x];
											} else {
												CasesBlock += '\t' + pars[x] + '\n';
											}
										}
									} else if(typeof pars[x] == 'undefined') {
										CasesBlock += '\n';
									} else {
										CasesBlock += pars[x];
									}
								}
							}
						}
					}
				}
				if(seq.elsed != '') {
					CasesBlock += Tokens.DefaultToken + ':';
					seq.elsed.unshift(undefined);
					var body = '';
					for(var j = 0; j < seq.elsed.length; j++) {
						if(typeof seq.elsed[j] == 'undefined') {
							body += '\n';
						} else {
							seq.elsed[j].only = true;
							if(typeof seq.elsed[j] == 'string') {
								body += evalStatement(seq.elsed[j]);
							} else {
								body += evalStatement(seq.elsed[j]) + '\n';
							}
						}
					}
					var pars = mammouth.LineTerminatorParser.parse(body);
					for(var x = 0; x < pars.length; x++) {
						if(pars[x] != '' || x == 0) {
							if(x == (pars.length - 1)) {
								CasesBlock += '\t' + pars[x];
							} else {
								if(seq.elsed.length == 1) {
									CasesBlock += '\t' + pars[x];
								} else {
									CasesBlock += '\t' + pars[x] + '\n';
								}
							}
						} else if(typeof pars[x] == 'undefined') {
							CasesBlock += '\n';
						} else {
							CasesBlock += pars[x];
						}
					}
				}
				var pars = mammouth.LineTerminatorParser.parse(CasesBlock);
				for(var x = 0; x < pars.length; x++) {
					if(pars[x] != '' || x == 0) {
						if(x == (pars.length - 1)) {
							r += '\t' + pars[x];
						} else {
							if(seq.cases.length == 1) {
								r += '\t' + pars[x];
							} else {
								r += '\t' + pars[x] + '\n';
							}
						}
					} else if(typeof pars[x] == 'undefined') {
						r += '\n';
					} else {
						r += pars[x];
					}
				}
				r += '}';
				return r;
		}
	};
	var interprete = function(code){
		var r = '';
		var seq = mammouth.parser.parse(code);
		for(var i = 0; i < seq.length; i++) {
			r += evalStatement(seq[i]);
		}
		return r;
	};
	var codeout = interprete(code);
	return codeout;
}