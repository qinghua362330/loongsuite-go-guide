import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { zeroDemos } from '../dist/course-demos.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loongsuite-teaching-deps-'));
const demo = path.join(root, 'demo');
const observer = path.join(root, 'observer');
const bin = path.join(root, 'demo-bin');
const env = {
  ...process.env,
  GO111MODULE: 'on',
  GOWORK: 'off',
  GOTOOLCHAIN: 'local',
  GOPROXY: 'off',
  GOSUMDB: 'off',
};
const records = [];

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const run = (label, args, expectedExit) => {
  const result = spawnSync('go', args, { cwd: demo, env, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  assert.equal(result.status, expectedExit, `${label}: unexpected exit\n${output}`);
  records.push({ label, command: `go ${args.join(' ')}`, exit: result.status, output });
  return output;
};

const runBinary = (label, expectedExit) => {
  const result = spawnSync(bin, [], { cwd: demo, env, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  assert.equal(result.status, expectedExit, `${label}: unexpected exit\n${output}`);
  records.push({ label, command: bin, exit: result.status, output });
  return output;
};

const assertTeachingFramesMatchEvidence = (stages) => {
  const frames = zeroDemos.deps?.cases?.[0]?.frames ?? [];
  assert.equal(frames.length, 5, 'dependency lesson must have five concrete frames');
  const [original, call, failure, dependency, runtime] = frames;
  assert.match(original.code.text, /func FindRoom\(id int\) string/);
  assert.match(original.code.text, /return "语聊房间"/);
  assert.doesNotMatch(original.code.text, /observer\.Record/);
  assert.match(call.code.text, /import "example\.com\/observer"/);
  const callIndex = call.code.text.indexOf('observer.Record("FindRoom")');
  const functionIndex = call.code.text.indexOf('func FindRoom');
  assert.ok(callIndex > functionIndex, 'observer.Record must be inside FindRoom');
  assert.match(failure.code.text, /go build/);
  assert.match(failure.code.text, /no required module provides package example\.com\/observer/);
  assert.match(dependency.code.text, /require example\.com\/observer/);
  assert.match(dependency.code.text, /replace example\.com\/observer => \.\.\/observer/);
  assert.match(runtime.code.text, /\.\/demo/);
  assert.match(runtime.code.text, /观察记录: FindRoom/);
  assert.match(runtime.code.text, /语聊房间/);
  assert.equal(stages[2].exit, 1, 'frame 3 must represent the failed build');
  assert.match(stages[2].output, /no required module provides package example\.com\/observer/);
  assert.equal(stages[3].exit, 0, 'frame 4 must represent the repaired build');
  assert.equal(stages[3].output, '', 'repaired build must not run the observer');
  assert.equal(stages[4].output, '观察记录: FindRoom\n语聊房间', 'frame 5 must match binary output');
};

try {
  const goVersion = execFileSync('go', ['version'], { encoding: 'utf8' }).trim();
  write(path.join(observer, 'go.mod'), 'module example.com/observer\n\ngo 1.24.0\n');
  write(path.join(observer, 'observer.go'), `package observer

import "fmt"

func Record(name string) { fmt.Println("观察记录:", name) }
`);
  write(path.join(demo, 'go.mod'), 'module example.com/demo\n\ngo 1.24.0\n');
  write(path.join(demo, 'main.go'), `package main

import "fmt"

func FindRoom(id int) string { return "语聊房间" }

func main() { fmt.Println(FindRoom(42)) }
`);

  run('原始业务可以构建', ['build', '-o', bin, '.'], 0);
  const plain = runBinary('运行 go build 生成的原始二进制', 0);
  assert.equal(plain, '语聊房间');

  write(path.join(demo, 'main.go'), `package main

import (
  "fmt"
  "example.com/observer"
)

func FindRoom(id int) string {
  observer.Record("FindRoom")
  return "语聊房间"
}

func main() { fmt.Println(FindRoom(42)) }
`);
  const missing = run('新增观察调用但未声明依赖时构建失败', ['build', '-o', bin, '.'], 1);
  assert.match(missing, /no required module provides package example\.com\/observer/);

  write(path.join(demo, 'go.mod'), `module example.com/demo

go 1.24.0

require example.com/observer v0.0.0

replace example.com/observer => ../observer
`);
  run('补齐 require 与本地 replace 后构建成功', ['build', '-o', bin, '.'], 0);
  const buildOutput = records.at(-1).output;
  assert.equal(buildOutput, '', 'go build should not execute the observer hook');
  const instrumented = runBinary('运行 go build 生成的包含观察调用的二进制', 0);
  assert.equal(instrumented, '观察记录: FindRoom\n语聊房间');
  assert.equal(fs.readFileSync(path.join(demo, 'go.mod'), 'utf8').includes('replace example.com/observer => ../observer'), true);
  assertTeachingFramesMatchEvidence(records);

  const evidence = {
    purpose: '教学模型：新增观察代码后，业务模块需要能解析并编译观察库；这不是 LoongSuite 自动插桩验收。',
    goVersion,
    layout: {
      business: 'demo/ (module example.com/demo)',
      externalLibrary: 'observer/ (module example.com/observer)',
    },
    fixtures: {
      business: fs.readFileSync(path.join(demo, 'main.go'), 'utf8'),
      observer: fs.readFileSync(path.join(observer, 'observer.go'), 'utf8'),
      goModBeforeDependency: 'module example.com/demo\n\ngo 1.24.0\n',
      goModAfterDependency: fs.readFileSync(path.join(demo, 'go.mod'), 'utf8'),
    },
    stages: records,
    conclusion: [
      '原始业务没有 observer 调用，因此只需自身代码即可构建。',
      '新增 import 和调用后，业务 go.mod 没有依赖声明，构建失败。',
      'require 声明模块，replace 将教学模块指向本地源码；补齐后才能构建。',
      'go build 只编译，不执行 Record；运行二进制时才出现观察记录。',
    ],
    teachingFrameAlignment: 'passed',
  };
  const evidencePath = path.join(process.cwd(), 'qa/teaching-deps/evidence.json');
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ teachingDeps: 'passed', stages: records.length, evidence: evidencePath }));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
