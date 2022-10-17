# text.management

This is an experiment in making an editor for livecoding. Ideally, such an editor will be two things:

- **Useful**: It should make writing live code easier, both with features common to code editors and with features specific to the context of livecoding. It should be useful to a wide variety of coders, from beginners to experts.
- **Expressive**: In keeping with the artistic nature of livecoding, it should be open for creative manipulation. The interface should be easily customized, and it should allow for a variety of visualizations and media to live with the code.

In its initial form, this is a webserver-based editor for the Tidal language. It requires [Node JS](https://nodejs.dev/) and [Tidal](https://tidalcycles.org/) to be installed independently.

## Usage

If you want to run this locally, you can install it with these steps:

1. Clone this repository.
2. Run the command `npm install -g` to set up dependencies and build a local version.
3. From anywhere on your computer, you can now run the command `text.management [filename]` to run the server. The filename argument specifies which Tidal file you want to edit. Changes to this file will be automatically saved. Leave this blank if you don't want to save your changes.
4. Navigate a browser to http://localhost:1234/ to use the interface.

## Development

## Limitations

This project is still in an early stage. It hasn't been tested on very many environments, so please reach out if you run into any issues. Many features don't exist, and a lot of basics are undocumented.

**Warning: If the server is running, then anyone on the local network can access the editor and execute arbitrary Haskell code on the host computer. Until better security and sandboxing is in place, be very cautious about running this on untrusted networks.**
