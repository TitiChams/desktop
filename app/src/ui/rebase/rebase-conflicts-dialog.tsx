import * as React from 'react'
import { DialogContent, Dialog, DialogFooter } from '../dialog'
import { ButtonGroup } from '../lib/button-group'
import { Button } from '../lib/button'
import { DialogHeader } from '../dialog/header'
import { WorkingDirectoryStatus } from '../../models/status'
import { getUnmergedFiles, getConflictedFiles } from '../../lib/status'
import { ConflictedFilesList } from './conflict-files-list'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { ManualConflictResolution } from '../../models/manual-conflict-resolution'
import { ContinueRebaseResult } from '../../lib/git'

interface IRebaseConflictsDialog {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
  readonly workingDirectory: WorkingDirectoryStatus
  readonly manualResolutions: Map<string, ManualConflictResolution>
  readonly openFileInExternalEditor: (path: string) => void
  readonly resolvedExternalEditor: string | null
  readonly openRepositoryInShell: (repository: Repository) => void
}

export class RebaseConflictsDialog extends React.Component<
  IRebaseConflictsDialog,
  {}
> {
  public async componentDidMount() {
    this.props.dispatcher.resolveCurrentEditor()
  }

  private onCancel = async () => {
    await this.props.dispatcher.abortRebase(this.props.repository)
    this.onDismissed()
  }

  private onDismissed = () => {
    this.props.onDismissed()
  }

  private onSubmit = async () => {
    const result = await this.props.dispatcher.continueRebase(
      this.props.repository,
      this.props.workingDirectory
    )

    if (result === ContinueRebaseResult.CompletedWithoutError) {
      this.props.onDismissed()
    }
  }

  public render() {
    const unmergedFiles = getUnmergedFiles(this.props.workingDirectory)
    const conflictedFilesCount = getConflictedFiles(
      this.props.workingDirectory,
      this.props.manualResolutions
    ).length

    const tooltipString =
      conflictedFilesCount > 0
        ? 'Resolve all conflicts before continuing'
        : undefined
    return (
      <Dialog
        id="rebase-conflicts-list"
        dismissable={true}
        onDismissed={this.onDismissed}
        disableClickDismissalAlways={true}
        onSubmit={this.onSubmit}
      >
        <DialogHeader
          title="Rebase conflicts found"
          dismissable={true}
          onDismissed={this.onDismissed}
        />
        <DialogContent>
          <ConflictedFilesList
            dispatcher={this.props.dispatcher}
            repository={this.props.repository}
            openFileInExternalEditor={this.props.openFileInExternalEditor}
            resolvedExternalEditor={this.props.resolvedExternalEditor}
            files={unmergedFiles}
          />
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button
              type="submit"
              disabled={conflictedFilesCount > 0}
              tooltip={tooltipString}
            >
              Continue rebase
            </Button>
            <Button onClick={this.onCancel}>Abort rebase</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }
}
