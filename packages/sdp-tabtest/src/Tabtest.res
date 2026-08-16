// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

open SdpProject

/* Filename -> Content */
type t = Map.String.t<string>

/* A probe is a node used later to inject values into a node under test.
   Kind of terminal, but for tests.

   A probe stores reference to its target pin. That pin’s label is guaranted
   to be normalized. */
module Probe = {
  type t = {
    node: Node.t,
    targetPin: Pin.t,
  }
  /* Trivial accessors */
  let getNode = (probe: t) => probe.node
  let getTargetPin = (probe: t) => probe.targetPin
  /* Returns full patch path for the probe of a given type. The probe patch
   nodes are stocked up in the `workspace` inside the package */
  let patchPath = (tp: Pin.primitiveDataType, dir: Pin.direction): string =>
    "xod/tabtest/" ++
    (switch dir {
    | Input => "inject-"
    | Output => "capture-"
    } ++
    switch tp {
    | Pulse => "pulse"
    | Boolean => "boolean"
    | Number => "number"
    | Byte => "byte"
    | String => "string"
    })
  /* Creates a new probe node matching the type of pin provided */
  let create = pin => {
    node: Node.create(patchPath(Pin.getPrimitiveTypeExn(pin), Pin.getDirection(pin))),
    targetPin: pin,
  }
  /* Returns a key of the only pin (conventionally labeled "VAL") for a
   probe node. */
  let getPinKeyExn = (probe, project) => {
    let node = getNode(probe)
    let pt = Node.getType(node)
    let patch = switch Project.getPatchByNode(project, node) {
    | Some(patch') => patch'
    | None => JsError.throwWithMessage("Probe has unexpected type " ++ pt)
    }
    let pin = Patch.findPinByLabel(patch, "VAL", ~normalize=true, ~direction=None)
    switch pin {
    | Some(pin) => Pin.getKey(pin)
    | None =>
      JsError.throwWithMessage(
        "Expected all probes to have the only pin labeled 'VAL'. " ++ (pt ++ " violates the rule"),
      )
    }
  }
}

/* Utilities to operate over lists of probes */
module Probes = {
  type t = list<Probe.t>
  let map = List.map
  let keepMap = List.keepMap
  let keepToPinDirection = (probes, dir) =>
    List.keep(probes, probe => probe->Probe.getTargetPin->Pin.getDirection == dir)
  let keepInjecting = keepToPinDirection(_, Input)
  let keepCapturing = keepToPinDirection(_, Output)
}

/* TODO: smarter errors */
let newError = (message: string): JsExn.t =>
  try JsError.throwWithMessage(message) catch {
  | JsExn(e) => e
  }

/* Test bench is a patch containing a central node under test and
 a set of probes connected to each of its pins. */
module Bench = {
  type t = {
    patch: Patch.t,
    probes: Probes.t,
    /* Maps pin labels of the node under test to probe node IDs */
    probeMap: Map.String.t<Node.id>,
  }
  /* Creates a new bench for the project provided with the specified
     node instance to test. The bench patch is *not* associated to the
     project automatically. */
  let create = (project, patchUnderTest): t => {
    /* nut = node under test */
    let nut = Node.create(Patch.getPath(patchUnderTest))
    let nutId = Node.getId(nut)
    let draftBench: t = {
      patch: Patch.create()->Patch.assocNode(nut),
      probes: list{},
      probeMap: Map.String.empty,
    }
    Patch.listPins(patchUnderTest)
    ->Pin.normalizeLabels
    /* For each pin of a node under test, create a new probe node
     and link its `VAL` to that pin. */
    ->List.map(Probe.create)
    ->List.reduce(draftBench, (bench, probe) => {
      let probeNode = Probe.getNode(probe)
      let probeId = Node.getId(probeNode)
      let probePK = Probe.getPinKeyExn(probe, project)
      let targPin = Probe.getTargetPin(probe)
      let targPK = Pin.getKey(targPin)
      let link = switch Pin.getDirection(targPin) {
      | Input => Link.create(~fromPin=probePK, ~fromNode=probeId, ~toPin=targPK, ~toNode=nutId)
      | Output => Link.create(~fromPin=targPK, ~fromNode=nutId, ~toPin=probePK, ~toNode=probeId)
      }
      {
        patch: bench.patch->Patch.assocNode(probeNode)->Patch.assocLink(link),
        probes: list{probe, ...bench.probes},
        probeMap: bench.probeMap->Map.String.set(Pin.getLabel(targPin), probeId),
      }
    }) /* reduce */
  }
}

/* A pico-framework to generate properly formatted C++ code.
 Knows nothing about tabular tests, i.e., purpose-neutral. */
module Cpp = {
  type code = string
  let source = children => BeltHoles.String.joinLines(children)
  let indented = children => children->BeltHoles.String.joinLines->BeltHoles.String.indent(4)
  let enquote = x => `"${x}"`
  let block = children => list{"{", indented(children), "}"}->BeltHoles.String.joinLines
  let catch2TestCase = (name, children) =>
    "TEST_CASE(" ++ (enquote(name) ++ (") " ++ block(children)))
  let catch2Section = (persistedValues, name, children) => {
    let joinedPersistedValues =
      List.length(persistedValues) > 0 ? BeltHoles.String.joinLines(persistedValues) ++ "\n" : ""

    joinedPersistedValues ++ ("SECTION(" ++ (enquote(name) ++ (") " ++ block(children))))
  }
  let requireEqual = (actual, expected) => `REQUIRE(${actual} == ${expected});`
  let requireIsNan = value => `REQUIRE(isnan(${value}));`
}

/* A test case corresponds to TEST_CASE in Catch2 and a single TSV tabtest in XOD. */
module TestCase = {
  /* Formats a tabular value to a valid C++ literal or expression */
  let valueToLiteral = (value: TabData.Value.t): string =>
    switch value {
    | Boolean(true) => "true"
    | Boolean(false) => "false"
    | Pulse(true) => "true /* pulse */"
    | Pulse(false) => "false /* no-pulse */"
    | NaN => "NAN"
    | String(x) =>
      let str = Cpp.enquote(x)
      `xod::XStringCString(${str})`
    | Number(x) if x === infinity => `(xod::Number) INFINITY`
    | Number(x) if x === neg_infinity => `(xod::Number) -INFINITY`
    | Number(x) => `(xod::Number) ${Float.toString(x)}`
    | ApproxNumber(x, exp) =>
      let margin = 10.0 ** Stdlib_Int.toFloat(exp) /. 2.0
      `Approx((xod::Number) ${Float.toString(x)}).margin(${Float.toString(margin)})`
    | x => String.make(x)
    }

  let shouldValueBePersistedBetweenCases = (value: TabData.Value.t): bool =>
    switch value {
    | String(_) => true
    | _ => false
    }

  let getPersistedValueName = (caseNumber: int, probeName: string): string =>
    `injected_case${Int.toString(caseNumber)}_${probeName}`

  /* Generates a block of code corresponding to a single TSV line check.
     Contains setup, evaluation, and assertion validation. It might
     be wrapped into Catch2 SECTION, the purpose is the same. */
  let generateSection = (record, probes, sectionIndex): Cpp.code => {
    let humanReadableCaseNumber = sectionIndex + 1
    let persistedInjectedValues =
      probes
      ->Probes.keepInjecting
      ->Probes.keepMap(probe => {
        let name = probe->Probe.getTargetPin->Pin.getLabel
        let probeName = Strings.cppEscape(name)
        switch record->TabData.Record.get(name) {
        | Some(RaisedError) => None
        | Some(value) =>
          if shouldValueBePersistedBetweenCases(value) {
            let name = getPersistedValueName(humanReadableCaseNumber, probeName)
            let literal = valueToLiteral(value)
            Some(`auto const ${name} = ${literal};`)
          } else {
            None
          }
        | None => None
        }
      })
    let injectionStatements =
      probes
      ->Probes.keepInjecting
      ->Probes.map(probe => {
        let name = probe->Probe.getTargetPin->Pin.getLabel
        let probeName = Strings.cppEscape(name)
        switch record->TabData.Record.get(name) {
        | Some(Pulse(false)) => `// No pulse for ${name}`
        | Some(Pulse(true)) => `INJECT_PULSE(probe_${probeName});`
        | Some(RaisedError) => `INJECT_ERROR(probe_${probeName});`
        | Some(value) =>
          let literal = shouldValueBePersistedBetweenCases(value)
            ? getPersistedValueName(humanReadableCaseNumber, probeName)
            : valueToLiteral(value)
          `INJECT(probe_${probeName}, ${literal});`
        | None => `// No changes for ${name}`
        }
      })
    let setTimeStatement = switch record->TabData.Record.get(SpecialColumns.time) {
    | Some(Number(t)) =>
      let time = Stdlib_Float.toInt(t)
      `mockTime(${Int.toString(time)});`
    | Some(_)
    | None => "mockTime(millis() + 1);"
    }
    let assertionsStatements =
      probes
      ->Probes.keepCapturing
      ->Probes.map(probe => {
        let name = probe->Probe.getTargetPin->Pin.getLabel
        switch record->Map.String.get(name) {
        | Some(NaN) =>
          Cpp.source(list{
            Cpp.requireIsNan(`probe_${name}.state.lastValue`),
            Cpp.requireEqual(`probe_${name}.state.hadError`, "false"),
          })
        | Some(RaisedError) => Cpp.requireEqual(`probe_${name}.state.hadError`, "true")
        | Some(value) =>
          Cpp.source(list{
            Cpp.requireEqual(`probe_${name}.state.lastValue`, valueToLiteral(value)),
            Cpp.requireEqual(`probe_${name}.state.hadError`, "false"),
          })
        | None => `// no expectation for ${name}`
        }
      })

    open Cpp
    catch2Section(
      persistedInjectedValues,
      `Case ${Int.toString(humanReadableCaseNumber)}`,
      list{
        source(injectionStatements),
        setTimeStatement,
        sectionIndex == 0 ? "setup();" : "loop();",
        source(assertionsStatements),
      },
    )
  }

  /* Generates a complete C++ source file with the test case for given data.
       @param name     a free-form string to use as Catch2 TEST_CASE name
       @param tabData  \m/
       @param idMap    a map from tested pin labels (FOO, IN1, OUT etc) to
                       IDs of corresponding probes in C++ code (0, 1, 2, etc)
       @param probes   \m/
 */
  let generate = (
    name: string,
    tabData: TabData.t,
    idMap: Map.String.t<string>,
    probes: Probes.t,
  ): Cpp.code => {
    let nodeAliases =
      idMap
      ->Map.String.toList
      ->List.map(((name, id)) => {
        let probeName = Strings.cppEscape(name)
        Cpp.source(list{
          `auto& probe_${probeName} = xod::node_${id};`,
          `#define MARK_DIRTY_probe_${probeName} xod::g_transaction.node_${id}_isNodeDirty = true;`,
        })
      })
    let sections =
      tabData->TabData.mapWithIndex((idx, record) => record->generateSection(probes, idx))
    open Cpp
    source(list{
      "#include \"catch.hpp\"",
      "#include <XStringFormat.inl>",
      "",
      source(nodeAliases),
      "",
      "#define INJECT(probe, value) \\",
      "        (probe)._output_VAL = (value); \\",
      "        (probe).state.shouldRaise = false; \\",
      "        MARK_DIRTY_##probe;",
      "",
      "#define INJECT_PULSE(probe) \\",
      "        (probe).state.shouldPulse = true; \\",
      "        (probe).state.shouldRaise = false; \\",
      "        MARK_DIRTY_##probe;",
      "",
      "#define INJECT_ERROR(probe) \\",
      "        (probe).state.shouldRaise = true;\\",
      "        MARK_DIRTY_##probe;",
      "",
      catch2TestCase(name, list{source(sections)}),
    })
  }
}

// Bare `@module` JSON imports compile to a static ESM import with no
// import attribute (`import x from "./y.json"`), which real Node ESM
// rejects (`with { type: "json" }` is required) -- and ReScript's %%raw
// blocks can't express the attribute syntax either way (confirmed: both
// "with" and the older "assert" form are hard parse errors in ReScript's
// raw-block tokenizer). An earlier version of this fix read the file via
// `fs.readFileSync` instead -- that satisfied Node but breaks the moment
// this module is bundled into the browser app (sdp-tabtest is pulled
// into sdp-client-browser for in-browser tabtest generation): `fs`/
// `node:fs` don't exist in a browser. tools/loadTabtestLibPatches.cjs
// generates a plain .js module with a named export instead of raw JSON --
// no import attribute needed at all, works identically under Node and
// webpack.
@module("../lib/tabtestLibPatches.js")
external tabtestLibPatches: array<SdpProject.Patch.t> = "tabtestLibPatches"

let generatePatchSuite = (project, patchPathToTest): XResult.t<t> => {
  let projectWithTabtestLib = SdpProject.Project.upsertPatches(
    project,
    Belt.List.fromArray(tabtestLibPatches),
  )

  let patchUnderTestOpt = Project.getPatchByPath(projectWithTabtestLib, patchPathToTest)
  let tsvOpt = patchUnderTestOpt->Option.flatMap(Patch.getTabtestContent)
  switch (patchUnderTestOpt, tsvOpt) {
  | (None, _) => Error(newError(`Patch ${patchPathToTest} does not exist in the project`))
  | (_, None) => Error(newError(`Patch ${patchPathToTest} has no tabular test data attached`))
  | (Some(patchUnderTest), Some(tsv)) =>
    let bench = Bench.create(projectWithTabtestLib, patchUnderTest)
    let probes = bench.probes
    let tabData = TabData.parse(tsv)
    let realPinLabels = bench.probeMap->Map.String.keysToArray->List.fromArray
    let testingPinLabels = tsv->TabData.listDataLines->List.getExn(0)->TabData.tabSplit
    let result = switch Validator.validatePinLabels(realPinLabels, testingPinLabels) {
    | Some(e) => Result.Error(e)
    | None =>
      let benchPatchPath = ("tabtest-" ++ patchPathToTest)->String.replace("-@", "/local")
      /* to convert "tabtest-@/foo" to "tabtest/local/foo" */
      let safeBasename =
        PatchPath.getBaseName(patchPathToTest)
        ->String.replace("(", "__")
        ->String.replace(",", "__")
        ->String.replace(")", "")
      let sketchFilename = safeBasename ++ ".sketch.cpp"
      let testFilename = safeBasename ++ ".catch.inl"
      let sketchFooter = `\\n\\n#include "${testFilename}"\\n`
      let liveness: SdpArduino.Transpiler.liveness = SdpArduino.Transpiler.None
      let xodGlobals: SdpArduino.Transpiler.xodGlobals = Map.String.empty
      Project.assocPatch(projectWithTabtestLib, benchPatchPath, bench.patch)
      ->SdpArduino.Transpiler.transpile(_, benchPatchPath, liveness, xodGlobals)
      ->BeltHoles.Result.map(program => {
        let idMap = BeltHoles.Map.String.innerJoin(bench.probeMap, program.nodeIdMap)
        let testCase = TestCase.generate(patchPathToTest, tabData, idMap, probes)
        Map.String.empty
        ->Map.String.set(sketchFilename, program.code ++ sketchFooter)
        ->Map.String.set(testFilename, testCase)
      })
    }
    result
  }
}

let generateProjectSuite = (project): XResult.t<t> =>
  project
  ->Project.listLocalPatches
  ->List.keep(Patch.hasTabtest)
  ->List.map(Patch.getPath)
  ->List.reduce(Belt.Result.Ok(Map.String.empty), (accFiles, patchPath) =>
    BeltHoles.Result.lift2(
      BeltHoles.Map.String.mergeOverride,
      accFiles,
      generatePatchSuite(project, patchPath),
    )
  )
