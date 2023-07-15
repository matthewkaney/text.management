:set -package hosc

import Control.Concurrent

import Sound.Osc.Fd

import Sound.Tidal.Context hiding (startStream, startTidal)
import qualified Sound.Tidal.Stream as Stream

import System.Environment (getEnv)

editorPort <- read <$> getEnv "editor_port" :: IO Int
editorSocket <- openUdp "127.0.0.1" editorPort

:{
startStream :: Config -> [(Target, [OSC])] -> IO Stream
startStream config oscmap
  = do tidal <- Stream.startStream config oscmap
       watchClock tidal
       return tidal
    where
      watchClock :: Stream -> IO ThreadId
      watchClock stream = forkIO checkClock
        where
          checkClock :: IO ()
          checkClock = do time <- streamGetnow stream
                          sendMessage editorSocket (Message "/now" [Float $ realToFrac time])
                          threadDelay 100000
                          checkClock
:}

:{
startTidal :: Target -> Config -> IO Stream
startTidal t c = startStream c [(t, [superdirtShape])]
:}
