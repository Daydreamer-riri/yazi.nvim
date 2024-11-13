import type { MyTestDirectoryFile } from "MyTestDirectory"

describe("reading events", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("can read 'cd' events and use telescope in the latest directory", () => {
    cy.startNeovim()
    // wait until text on the start screen is visible
    cy.contains("If you see this text, Neovim is ready!")
    // start yazi
    cy.typeIntoTerminal("{upArrow}")

    // move to the parent directory. This should make yazi send the "cd" event,
    // indicating that the directory was changed
    cy.contains("subdirectory")
    cy.typeIntoTerminal("/subdirectory{enter}")
    cy.typeIntoTerminal("{rightArrow}")
    cy.typeIntoTerminal("{control+s}")

    // telescope should now be visible. Let's search for the contents of the
    // file, which we know beforehand
    cy.contains("Grep in")
    cy.typeIntoTerminal("This")

    // we should see text indicating the search is limited to the current
    // directory
    cy.contains("This is other-sub-file.txt")
  })

  it("can read 'trash' events and close an open buffer when its file was trashed", () => {
    // NOTE: trash means moving a file to the trash, not deleting it permanently

    cy.startNeovim().then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // modify the buffer to make sure it works even if the buffer is modified
      cy.typeIntoTerminal("ccchanged{esc}")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // start file deletion
      cy.typeIntoTerminal("d")
      cy.contains("Trash 1 selected file?")
      cy.typeIntoTerminal("y")

      cy.get("Move 1 selected file to trash").should("not.exist")

      // close yazi
      cy.typeIntoTerminal("q")

      // internally, we should have received a trash event from yazi, and yazi.nvim should
      // have closed the buffer
      cy.contains(dir.contents["initial-file.txt"].name).should("not.exist")
      cy.contains("If you see this text, Neovim is ready").should("not.exist")
    })
  })

  it("can read 'delete' events and close an open buffer when its file was deleted", () => {
    // NOTE: delete means permanently deleting a file (not moving it to the trash)

    cy.startNeovim().then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // modify the buffer to make sure it works even if the buffer is modified
      cy.typeIntoTerminal("ccchanged{esc}")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // start file deletion
      cy.typeIntoTerminal("D")
      cy.contains("Permanently delete 1 selected file?")
      cy.typeIntoTerminal("y")

      cy.get("Delete 1 selected file permanently").should("not.exist")

      // close yazi
      cy.typeIntoTerminal("q")

      // internally, we should have received a delete event from yazi, and yazi.nvim should
      // have closed the buffer
      cy.get(dir.contents["initial-file.txt"].name).should("not.exist")
      cy.contains("If you see this text, Neovim is ready").should("not.exist")
    })
  })
})

describe("'rename' events", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("can read 'rename' events and update the buffer name when the file was renamed", () => {
    cy.startNeovim().then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // start file renaming
      cy.typeIntoTerminal("r")
      cy.contains("Rename:")
      cy.typeIntoTerminal("2{enter}")

      cy.get("Rename").should("not.exist")

      // yazi should be showing the new file name
      const newFileName = `initial-file2.txt`
      cy.contains(newFileName)

      // close yazi
      cy.typeIntoTerminal("q")

      // the buffer name should now be updated
      cy.contains(newFileName)
    })
  })

  it("can rename twice and keep track of the correct file name", () => {
    cy.startNeovim().then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // start file renaming
      cy.typeIntoTerminal("r")
      cy.contains("Rename:")
      cy.typeIntoTerminal("2{enter}")

      cy.get("Rename").should("not.exist")

      // yazi should be showing the new file name
      const newFileName = "initial-file2.txt"
      cy.contains(newFileName)

      // close yazi
      cy.typeIntoTerminal("q")

      // the buffer name should now be updated
      cy.contains(newFileName)

      // rename a second time, returning to the original name
      cy.typeIntoTerminal("{upArrow}")
      cy.typeIntoTerminal("r")
      cy.contains("Rename:")
      cy.typeIntoTerminal("{backspace}")
      cy.contains(newFileName)
      cy.typeIntoTerminal("{enter}")

      cy.typeIntoTerminal("q")
      cy.contains(newFileName).should("not.exist")
    })
  })

  it("can publish YaziRenamedOrMoved events when a file is renamed", () => {
    cy.startNeovim({
      startupScriptModifications: ["notify_rename_events.lua"],
    }).then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // start file renaming
      cy.typeIntoTerminal("r")
      cy.contains("Rename:")
      cy.typeIntoTerminal("2{enter}")

      cy.get("Rename").should("not.exist")

      // yazi should be showing the new file name
      const newFileName = `initial-file2.txt`
      cy.contains(newFileName)

      // close yazi
      cy.typeIntoTerminal("q")

      // yazi should now be closed
      cy.contains("-- TERMINAL --").should("not.exist")

      cy.typeIntoTerminal(":mes{enter}")
      cy.contains("Just received a YaziRenamedOrMoved event!")
    })
  })

  it("reports the correct last_directory when yazi is closed", () => {
    cy.startNeovim({
      startupScriptModifications: [
        "modify_yazi_config_log_yazi_closed_successfully.lua",
      ],
    }).then((dir) => {
      // the default file should already be open
      cy.contains(dir.contents["initial-file.txt"].name)
      cy.contains("If you see this text, Neovim is ready!")

      // start yazi
      cy.typeIntoTerminal("{upArrow}")

      // move to another directory
      cy.typeIntoTerminal(
        `/${"dir with spaces" satisfies MyTestDirectoryFile}{enter}`,
      )
      cy.typeIntoTerminal("{rightArrow}")
      cy.contains("this is the first file")

      // close yazi
      cy.typeIntoTerminal("q")

      // yazi should now be closed
      cy.contains("-- TERMINAL --").should("not.exist")

      cy.contains("yazi_closed_successfully hook")
      cy.contains("last_directory = ")
      cy.contains("dir with spaces")
    })
  })
})
