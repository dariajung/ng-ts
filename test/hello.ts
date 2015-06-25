class Greeter {
    constructor(public greeting: string, public name: string) { 
    }
    greet() {
        return "<h1>" + this.name + "says: " + this.greeting + "</h1>";
    }
};
var greeter = new Greeter("Hello, world!", 7);
var str = greeter.greet();
document.body.innerHTML = str;

