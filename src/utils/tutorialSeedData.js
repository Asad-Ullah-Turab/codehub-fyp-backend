// Pre-generated tutorials for Python, C++, and JavaScript
// These will be seeded into the database

export const preGeneratedTutorials = [
  // ============ PYTHON TUTORIALS ============
  {
    title: 'Understanding Variables in Python',
    description: 'Learn how to create and use variables in Python programming',
    content: `Variables are containers for storing data values. In Python, you don't need to declare a variable type explicitly - Python will determine it based on the value assigned.

Key Points:
- Variable names are case-sensitive
- Variable names must start with a letter or underscore
- Variable names can only contain alphanumeric characters and underscores
- Python uses dynamic typing, so the same variable can hold different types of data`,
    language: 'python',
    concept: 'Variables',
    difficulty: 'beginner',
    notes: [
      'Variable names should be descriptive and use snake_case',
      'Avoid using Python keywords as variable names',
      'Use meaningful names to make code more readable'
    ],
    tips: [
      'Always initialize variables before using them',
      'Use type hints for better code clarity',
      'Test your variable assignments in the Python interpreter'
    ],
    codeExamples: [
      {
        title: 'Basic Variable Assignment',
        description: 'Create and print variables of different types',
        code: `name = "Alice"
age = 25
height = 5.7
is_student = True

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Height: {height}")
print(f"Is Student: {is_student}")`,
        input: '',
        expectedOutput: `Name: Alice
Age: 25
Height: 5.7
Is Student: True`,
        order: 1
      },
      {
        title: 'Variable Type Checking',
        description: 'Learn how to check variable types using type()',
        code: `name = "Bob"
age = 30
score = 92.5

print(type(name))
print(type(age))
print(type(score))`,
        input: '',
        expectedOutput: `<class 'str'>
<class 'int'>
<class 'float'>`,
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['basics', 'fundamentals', 'variables'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'Python Data Types Explained',
    description: 'Comprehensive guide to Python built-in data types',
    content: `Python has several built-in data types that allow you to store different kinds of information:

1. **String (str)**: Text data enclosed in quotes
2. **Integer (int)**: Whole numbers
3. **Float (float)**: Decimal numbers
4. **Boolean (bool)**: True or False values
5. **List (list)**: Ordered collection of items
6. **Tuple (tuple)**: Immutable ordered collection
7. **Dictionary (dict)**: Key-value pairs
8. **Set (set)**: Unordered collection of unique items`,
    language: 'python',
    concept: 'Data Types',
    difficulty: 'beginner',
    notes: [
      'Lists are mutable, tuples are immutable',
      'Dictionaries use key-value pairs',
      'Sets automatically remove duplicates'
    ],
    tips: [
      'Use type() function to check data type',
      'Convert between types using int(), str(), float(), etc.',
      'Choose appropriate data type for your use case'
    ],
    codeExamples: [
      {
        title: 'All Basic Data Types',
        description: 'Example of each basic Python data type',
        code: `# String
text = "Hello Python"

# Numbers
integer_num = 42
float_num = 3.14

# Boolean
is_active = True

# List
colors = ["red", "green", "blue"]

# Tuple
coordinates = (10, 20)

# Dictionary
person = {"name": "John", "age": 30}

# Set
unique_numbers = {1, 2, 3, 2, 1}

print(f"String: {text}")
print(f"List: {colors}")
print(f"Dictionary: {person}")
print(f"Set: {unique_numbers}")`,
        input: '',
        expectedOutput: `String: Hello Python
List: ['red', 'green', 'blue']
Dictionary: {'name': 'John', 'age': 30}
Set: {1, 2, 3}`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['data-types', 'fundamentals'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'Control Flow: If-Else Statements',
    description: 'Master conditional statements in Python',
    content: `If-else statements allow your program to make decisions based on conditions. The program executes different blocks of code depending on whether a condition is true or false.

Basic Structure:
- if: executes if condition is True
- elif: executes if previous condition was False and this is True
- else: executes if all conditions were False`,
    language: 'python',
    concept: 'Control Flow',
    difficulty: 'beginner',
    notes: [
      'Indentation is crucial in Python',
      'Use comparison operators: ==, !=, <, >, <=, >=',
      'Combine conditions with "and", "or", "not"'
    ],
    tips: [
      'Always check your logic before running',
      'Test with different input values',
      'Use meaningful variable names in conditions'
    ],
    codeExamples: [
      {
        title: 'Simple If-Else',
        description: 'Check if a number is positive or negative',
        code: `age = int(input("Enter your age: "))

if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")`,
        input: '20',
        expectedOutput: 'You are an adult',
        order: 1
      },
      {
        title: 'If-Elif-Else',
        description: 'Grade assignment based on marks',
        code: `marks = int(input("Enter your marks: "))

if marks >= 90:
    grade = 'A'
elif marks >= 80:
    grade = 'B'
elif marks >= 70:
    grade = 'C'
else:
    grade = 'F'

print(f"Your grade: {grade}")`,
        input: '85',
        expectedOutput: 'Your grade: B',
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['control-flow', 'conditionals'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'Loops: For and While',
    description: 'Learn to repeat code using loops',
    content: `Loops allow you to repeat a block of code multiple times. Python supports two types of loops:

1. **for loop**: Used to iterate through a sequence (list, string, range, etc.)
2. **while loop**: Repeats code while a condition is True

Both types support break and continue statements to control loop flow.`,
    language: 'python',
    concept: 'Loops',
    difficulty: 'beginner',
    notes: [
      'break: exits the loop immediately',
      'continue: skips current iteration',
      'range(start, stop, step) generates sequence of numbers'
    ],
    tips: [
      'Use for loops for known number of iterations',
      'Use while loops for conditional iterations',
      'Avoid infinite loops by ensuring loop condition will become False'
    ],
    codeExamples: [
      {
        title: 'For Loop with Range',
        description: 'Print numbers from 1 to 5',
        code: `for i in range(1, 6):
    print(i)`,
        input: '',
        expectedOutput: `1
2
3
4
5`,
        order: 1
      },
      {
        title: 'While Loop',
        description: 'Count down from 5 to 1',
        code: `count = 5
while count > 0:
    print(count)
    count -= 1`,
        input: '',
        expectedOutput: `5
4
3
2
1`,
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['loops', 'control-flow'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'Functions in Python',
    description: 'Create reusable code with functions',
    content: `Functions are reusable blocks of code that perform a specific task. They help organize code, reduce repetition, and make programs easier to maintain.

Key Components:
- def: keyword to define a function
- Function name: should be descriptive and lowercase
- Parameters: inputs to the function
- Return statement: outputs from the function`,
    language: 'python',
    concept: 'Functions',
    difficulty: 'beginner',
    notes: [
      'Functions must be defined before they are called',
      'Parameters are optional',
      'Return statement is optional (returns None if omitted)',
      'Functions can return multiple values as a tuple'
    ],
    tips: [
      'Use meaningful function names',
      'Add docstrings to explain what functions do',
      'Keep functions focused on a single task'
    ],
    codeExamples: [
      {
        title: 'Simple Function',
        description: 'Function that greets a person',
        code: `def greet(name):
    return f"Hello, {name}!"

message = greet("Alice")
print(message)`,
        input: '',
        expectedOutput: 'Hello, Alice!',
        order: 1
      },
      {
        title: 'Function with Multiple Parameters',
        description: 'Calculate sum of two numbers',
        code: `def add_numbers(a, b):
    return a + b

result = add_numbers(10, 20)
print(f"Sum: {result}")`,
        input: '',
        expectedOutput: 'Sum: 30',
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['functions', 'code-organization'],
    createdBy: null,
    isAIgenerated: false
  },

  // ============ C++ TUTORIALS ============
  {
    title: 'C++ Variables and Data Types',
    description: 'Understanding variables and data types in C++',
    content: `Variables are named memory locations that store values. In C++, variables must be declared with a specific data type before use.

Common Data Types:
- int: integer numbers
- float: decimal numbers
- double: high-precision decimal numbers
- char: single character
- bool: true or false
- string: text strings`,
    language: 'cpp',
    concept: 'Variables',
    difficulty: 'beginner',
    notes: [
      'Variables must be declared before use',
      'Variable names are case-sensitive',
      'Initialization assigns initial value to variable'
    ],
    tips: [
      'Always initialize variables before using them',
      'Use meaningful variable names',
      'Use const for values that should not change'
    ],
    codeExamples: [
      {
        title: 'Basic Variable Declaration',
        description: 'Declare and initialize variables',
        code: `#include <iostream>
using namespace std;

int main() {
    int age = 25;
    float height = 5.7;
    char grade = 'A';
    string name = "John";
    
    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
    cout << "Height: " << height << endl;
    cout << "Grade: " << grade << endl;
    
    return 0;
}`,
        input: '',
        expectedOutput: `Name: John
Age: 25
Height: 5.7
Grade: A`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['basics', 'variables', 'data-types'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'C++ Input and Output',
    description: 'Learn to read input and display output',
    content: `C++ provides cin for input and cout for output:

- **cout**: displays output on the screen
- **cin**: reads input from the keyboard
- **<<**: insertion operator (for output)
- **>>**: extraction operator (for input)
- **endl**: ends the line and flushes the buffer`,
    language: 'cpp',
    concept: 'Input/Output',
    difficulty: 'beginner',
    notes: [
      'Always include <iostream> header',
      'Use using namespace std; to avoid std:: prefix',
      'cin stops reading at whitespace'
    ],
    tips: [
      'Provide clear prompts before asking for input',
      'Validate user input when possible',
      'Use endl or "\\n" to end lines'
    ],
    codeExamples: [
      {
        title: 'Basic Input/Output',
        description: 'Read name and age, display greeting',
        code: `#include <iostream>
using namespace std;

int main() {
    string name;
    int age;
    
    cout << "Enter your name: ";
    cin >> name;
    
    cout << "Enter your age: ";
    cin >> age;
    
    cout << "Hello, " << name << "! You are " << age << " years old." << endl;
    
    return 0;
}`,
        input: 'Alice\n28',
        expectedOutput: 'Enter your name: Enter your age: Hello, Alice! You are 28 years old.',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['input-output', 'basics'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'C++ Control Structures: If-Else',
    description: 'Make decisions in your C++ programs',
    content: `If-else statements allow your program to execute different code based on conditions.

Syntax:
\`\`\`
if (condition) {
    // code if condition is true
} else if (condition2) {
    // code if condition2 is true
} else {
    // code if all conditions are false
}
\`\`\``,
    language: 'cpp',
    concept: 'Control Structures',
    difficulty: 'beginner',
    notes: [
      'Use curly braces {} to define code blocks',
      'Comparison operators: ==, !=, <, >, <=, >=',
      'Logical operators: &&, ||, !'
    ],
    tips: [
      'Indent your code for readability',
      'Test with various input values',
      'Use else if for multiple conditions'
    ],
    codeExamples: [
      {
        title: 'Check Even or Odd',
        description: 'Determine if a number is even or odd',
        code: `#include <iostream>
using namespace std;

int main() {
    int num;
    
    cout << "Enter a number: ";
    cin >> num;
    
    if (num % 2 == 0) {
        cout << num << " is even" << endl;
    } else {
        cout << num << " is odd" << endl;
    }
    
    return 0;
}`,
        input: '7',
        expectedOutput: '7 is odd',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['control-structures', 'conditionals'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'C++ Loops: For and While',
    description: 'Repeat code using loops',
    content: `Loops are used to repeat a block of code multiple times:

1. **for loop**: Best when you know how many times to repeat
2. **while loop**: Best when you repeat based on a condition
3. **do-while loop**: Always executes at least once`,
    language: 'cpp',
    concept: 'Loops',
    difficulty: 'beginner',
    notes: [
      'for loop: for(init; condition; increment)',
      'while loop: while(condition)',
      'do-while: do { } while(condition);'
    ],
    tips: [
      'Use break to exit loop early',
      'Use continue to skip current iteration',
      'Avoid infinite loops'
    ],
    codeExamples: [
      {
        title: 'For Loop: Print 1 to 5',
        description: 'Simple for loop counting up',
        code: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << i << endl;
    }
    return 0;
}`,
        input: '',
        expectedOutput: `1
2
3
4
5`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['loops', 'control-structures'],
    createdBy: null,
    isAIgenerated: false
  },

  // ============ JAVASCRIPT TUTORIALS ============
  {
    title: 'JavaScript Variables and Data Types',
    description: 'Learn about variables and primitive data types in JavaScript',
    content: `Variables store data values in JavaScript. You can declare variables using var, let, or const keywords.

Data Types:
- **string**: Text enclosed in quotes
- **number**: Integer or decimal numbers
- **boolean**: true or false
- **null**: Intentionally empty value
- **undefined**: Variable declared but not assigned
- **object**: Complex data structure
- **array**: Ordered list of values`,
    language: 'javascript',
    concept: 'Variables',
    difficulty: 'beginner',
    notes: [
      'const is preferred for modern JavaScript',
      'let has block scope, var has function scope',
      'Always use meaningful variable names'
    ],
    tips: [
      'Avoid using var in modern code',
      'Use const by default, let if you need to reassign',
      'Initialize variables at declaration time'
    ],
    codeExamples: [
      {
        title: 'Variable Declaration',
        description: 'Different ways to declare variables',
        code: `const name = "Alice";
let age = 25;
const isStudent = true;

console.log(name);
console.log(age);
console.log(isStudent);`,
        input: '',
        expectedOutput: `Alice
25
true`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['variables', 'basics'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'JavaScript Conditional Statements',
    description: 'Control program flow with if-else statements',
    content: `Conditional statements execute different code based on conditions.

Syntax:
\`\`\`javascript
if (condition) {
    // code if true
} else if (condition2) {
    // code if condition2 true
} else {
    // code if all false
}
\`\`\`

You can also use the ternary operator: condition ? valueIfTrue : valueIfFalse`,
    language: 'javascript',
    concept: 'Conditionals',
    difficulty: 'beginner',
    notes: [
      'Comparison operators: ==, ===, !=, !==, <, >, <=, >=',
      'Logical operators: &&, ||, !',
      'Use === for strict equality (recommended)'
    ],
    tips: [
      'Always use === instead of ==',
      'Combine conditions with && and ||',
      'Test all branches of your conditionals'
    ],
    codeExamples: [
      {
        title: 'If-Else Statement',
        description: 'Check if age is adult or minor',
        code: `const age = 18;

if (age >= 18) {
    console.log("You are an adult");
} else {
    console.log("You are a minor");
}`,
        input: '',
        expectedOutput: 'You are an adult',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['conditionals', 'control-flow'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'JavaScript Loops',
    description: 'Repeat code using for, while, and forEach loops',
    content: `Loops repeat code blocks multiple times:

1. **for**: Classic loop with initialization, condition, and increment
2. **while**: Repeats while condition is true
3. **do-while**: Always executes at least once
4. **forEach**: Iterates over array elements
5. **for...of**: Iterates over values
6. **for...in**: Iterates over property keys`,
    language: 'javascript',
    concept: 'Loops',
    difficulty: 'beginner',
    notes: [
      'forEach doesn\'t support break/continue',
      'for...in iterates over keys',
      'for...of iterates over values'
    ],
    tips: [
      'Use appropriate loop type for your situation',
      'Avoid infinite loops',
      'Use break to exit early, continue to skip iteration'
    ],
    codeExamples: [
      {
        title: 'For Loop',
        description: 'Count from 1 to 5',
        code: `for (let i = 1; i <= 5; i++) {
    console.log(i);
}`,
        input: '',
        expectedOutput: `1
2
3
4
5`,
        order: 1
      },
      {
        title: 'Array forEach',
        description: 'Iterate over array elements',
        code: `const colors = ["red", "green", "blue"];

colors.forEach(color => {
    console.log(color);
});`,
        input: '',
        expectedOutput: `red
green
blue`,
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['loops', 'control-flow'],
    createdBy: null,
    isAIgenerated: false
  },
  {
    title: 'JavaScript Functions',
    description: 'Create reusable code with functions',
    content: `Functions are reusable blocks of code that perform specific tasks.

Declaration Methods:
1. **Function Declaration**: function name() { }
2. **Function Expression**: const name = function() { }
3. **Arrow Functions**: const name = () => { }

Functions can have parameters and return values.`,
    language: 'javascript',
    concept: 'Functions',
    difficulty: 'beginner',
    notes: [
      'Arrow functions are concise syntax',
      'Parameters are optional',
      'Functions are first-class objects'
    ],
    tips: [
      'Use descriptive function names',
      'Keep functions focused and single-purpose',
      'Consider default parameters'
    ],
    codeExamples: [
      {
        title: 'Function Declaration',
        description: 'Simple function to add two numbers',
        code: `function add(a, b) {
    return a + b;
}

console.log(add(5, 3));`,
        input: '',
        expectedOutput: '8',
        order: 1
      },
      {
        title: 'Arrow Function',
        description: 'Concise arrow function syntax',
        code: `const multiply = (a, b) => a * b;

console.log(multiply(4, 5));`,
        input: '',
        expectedOutput: '20',
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['functions', 'code-organization'],
    createdBy: null,
    isAIgenerated: false
  }
];

export default preGeneratedTutorials;
