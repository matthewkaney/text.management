# untitled live code editor

This is an experiment in making an editor for live coding (or at least useful constituent parts for such an editor). It's motivated by the idea that live coding is 1) a coding practice with unique idioms and affordances not necessarily supported by traditional code editors, and 2) a performance, where the visual appearance of the code and editor is a potential space for creative expression.

As such, the goal for this project is to create an editor that's maximally configurable, while also generating useful features and components that can be used by the broader community of live coders and toolmakers.

In its initial form, this is a webserver-based editor for the Tidal Cycles language. It requires Node JS and Tidal to be installed independently. It can be installed like so:

1. Clone this repository.
2. Run the command `npm install` to set up dependencies.
3. Run the command `npm build` to build a local version of the server.
4. Run the command `npm start` to run the server.
5. Navigate a browser to http://localhost:1234/ to use the interface.
