-- :set -package hosc

import System.Environment (getEnv)

editorPort <- read <$> getEnv "editor_port" :: IO Int