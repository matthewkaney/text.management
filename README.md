# text.management

This is an experiment in making an editor for livecoding. Ideally, such an editor will be two things:

- **Useful**: It should make writing live code easier, both with features common to code editors and with features specific to the context of livecoding. It should be useful to a wide variety of coders, from beginners to experts.
- **Expressive**: In keeping with the artistic nature of livecoding, it should be open for creative manipulation. The interface should be easily customized, and it should allow for a variety of visualizations and media to live with the code.

In its initial form, this is an editor for the Tidal language. It requires [Tidal](https://tidalcycles.org/) to be installed independently.

It's available as a desktop app for Mac/Windows/Linux. Builds (still in a pretty alpha state) can be downloaded from the [releases page](https://github.com/mindofmatthew/text.management/releases).

## Usage

- Open the app and it should launch an instance of Tidal Cycles, using the default `BootTidal.hs` file for your version of Tidal
- Write and edit Tidal code, just like normal
- **Shift-Enter**: Evaluate the current line
- **Ctrl/Cmd-Enter**: Evaluate the current block of lines (basically, all lines separated by blank lines)
- **Escape**: Clear terminal messages and dismiss the terminal

## Limitations

This project is still in an early stage. It hasn't been tested on very many environments, so please reach out if you run into any issues. Many features don't exist, and a lot of basics are undocumented.

Earlier versions of this project have run either on the web or as a Node package. For now, don't use these versions&mdash;the desktop (Electron) release is the current most stable version and collaboration/web features will eventually be integrated back into that.
