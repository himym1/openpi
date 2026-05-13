import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getFileTree } from '../electron/gitHost'

let tmp: string | null = null

function makeWorkspace(): string {
  tmp = mkdtempSync(join(tmpdir(), 'openpi-file-tree-'))
  return tmp
}

function flattenTreePaths(tree: ReturnType<typeof getFileTree>): string[] {
  const paths: string[] = []

  const visit = (nodes: typeof tree.children) => {
    for (const node of nodes) {
      paths.push(node.path)
      if (node.children) visit(node.children)
    }
  }

  visit(tree.children)
  return paths
}

afterEach(() => {
  if (tmp) {
    rmSync(tmp, { recursive: true, force: true })
    tmp = null
  }
})

describe('getFileTree', () => {
  it('includes local files below the old three-level cutoff', () => {
    const cwd = makeWorkspace()
    mkdirSync(join(cwd, 'a/b/c/d/e'), { recursive: true })
    writeFileSync(join(cwd, 'a/b/c/d/e/deep.txt'), 'deep')

    expect(flattenTreePaths(getFileTree(cwd))).toContain('a/b/c/d/e/deep.txt')
  })

  it('excludes ignored dependency and build directories', () => {
    const cwd = makeWorkspace()
    mkdirSync(join(cwd, 'node_modules/pkg'), { recursive: true })
    mkdirSync(join(cwd, 'src'), { recursive: true })
    writeFileSync(join(cwd, 'node_modules/pkg/index.js'), 'ignored')
    writeFileSync(join(cwd, 'src/index.ts'), 'included')

    const paths = flattenTreePaths(getFileTree(cwd))
    expect(paths).toContain('src/index.ts')
    expect(paths).not.toContain('node_modules')
    expect(paths).not.toContain('node_modules/pkg/index.js')
  })
})
