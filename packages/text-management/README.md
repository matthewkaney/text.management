# text.management

This is an experiment in making an editor for livecoding. Ideally, such an editor will be two things:

- **Useful**: It should make writing live code easier, both with features common to code editors and with features specific to the context of livecoding. It should be useful to a wide variety of coders, from beginners to experts.
- **Expressive**: In keeping with the artistic nature of livecoding, it should be open for creative manipulation. The interface should be easily customized, and it should allow for a variety of visualizations and media to live with the code.

In its initial form, this is a webserver-based editor for the Tidal language. It requires [Node JS](https://nodejs.dev/) and [Tidal](https://tidalcycles.org/) to be installed independently.

## Usage

You can install the headless server with `npm install -g text-management`.

This will install the `text-management` binary. Run this binary file from your terminal.

## Limitations

This project is still in an early stage. It hasn't been tested on very many environments, so please reach out if you run into any issues. Many features don't exist, and a lot of basics are undocumented.

**Warning: If the server is running, then anyone on the local network can access the editor and execute arbitrary Haskell code on the host computer. Until better security and sandboxing is in place, be very cautious about running this on untrusted networks.**
