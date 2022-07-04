import { invoke } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event'
import { useCallback, useContext, useEffect, useState } from 'react'
import { KeyboardShortcuts, MidiNumbers, Piano } from 'react-piano'
import 'react-piano/dist/styles.css'
import styled from 'styled-components'
import SoundfontProvider from '../SoundfontProvider'
import { TrainerContext } from '../TrainerProvider'

const KeyboardContainer = styled.div`
  height: 25vh;
`

const Keyboard = () => {
  const { nextTargetNote, setNoteCounter } = useContext(TrainerContext)
  const [activeNotes, setActiveNotes] = useState<{ [note: string]: boolean }>(
    {}
  )
  const firstNote = MidiNumbers.fromNote('c3')
  const lastNote = MidiNumbers.fromNote('c5')
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote,
    lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

  const [isListening, setIsListening] = useState(false)

  const onLoadCallback = useCallback(() => {
    if (isListening) return
    invoke('open_midi_connection', { inputIdx: 0 })

    listen('midi_message', (event) => {
      const payload = event.payload as { message: number[] }
      const [command, note] = payload.message

      if (command === 144) {
        setActiveNotes((an) => ({
          ...an,
          [note]: true,
        }))
      }

      if (command === 128) {
        setActiveNotes((an) => ({
          ...an,
          [note]: false,
        }))
      }
    }).catch(console.error)

    console.log('Connected & listening to MIDI device...')
    setIsListening(true)
  }, [isListening, setIsListening])

  useEffect(() => {
    onLoadCallback()
  }, [onLoadCallback, isListening])

  return (
    <SoundfontProvider
      instrumentName={'acoustic_grand_piano'}
      hostname={'https://d1pzp51pvbm36p.cloudfront.net'}
      format={'mp3'}
      soundfont={'MusyngKite'}
      onLoad={() => {}}
      render={({ playNote, stopNote }) => {
        return (
          <KeyboardContainer>
            <Piano
              noteRange={{ first: firstNote, last: lastNote }}
              playNote={(midiNumber: number) => {
                if (midiNumber === nextTargetNote) {
                  setNoteCounter?.((nc) => nc + 1)
                }

                playNote(midiNumber)
              }}
              stopNote={(midiNumber: number) => {
                stopNote(midiNumber)
              }}
              keyboardShortcuts={keyboardShortcuts}
              renderNoteLabel={({ midiNumber }: { midiNumber: number }) => (
                <p className='ReactPiano__NoteLabel'>
                  {MidiNumbers.getAttributes(midiNumber).note.replace(
                    /[0-9]/,
                    ''
                  )}
                </p>
              )}
              activeNotes={Object.keys(activeNotes)
                .filter((v: string) => activeNotes[v])
                .map((s: string) => Number(s))}
            />
          </KeyboardContainer>
        )
      }}
    />
  )
}

export default Keyboard