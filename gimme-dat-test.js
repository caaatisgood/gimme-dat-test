// import Comp from './src/components/PersonInfo'

const get = require('lodash/get')
const fs = require('fs')
const babylon = require('@babel/parser')

const parserOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
  ]
}

const TYPES = {
  JSX_OPENING_ELEMENT: 'JSXOpeningElement',
  JSX_EXPRESSION_CONTAINER: 'JSXExpressionContainer',
  IDENTIFIER: 'Identifier',
}

const getCode = path => fs.readFileSync(path, 'utf8')
const parseAst = code => babylon.parse(code, parserOptions)

const checkHasJsxOpeningEl = node => (
  get(node, 'openingElement.type') === TYPES.JSX_OPENING_ELEMENT
)

const checkJsxExpContainer = node => (
  node.type === TYPES.JSX_EXPRESSION_CONTAINER
)

const getExpIdentifier = node => (
  (node.expression.type === TYPES.IDENTIFIER) && node.expression.name
)

const getClassNameFromNode = node => (
  node.attributes.reduce((className, node) => (
    node.name.name === 'className'
      ? node.value.value
      : className
  ), undefined)
)

const pairs = [] // array of identifiers and className
const search = (node, className) => {
  // get className
  let tempClassName
  const hasJsxOpeningEl = checkHasJsxOpeningEl(node)
  if (hasJsxOpeningEl) {
    tempClassName = getClassNameFromNode(node.openingElement)
  }

  // get identifier
  const isJsxExpContainer = checkJsxExpContainer(node)
  if (isJsxExpContainer) {
    const identifier = getExpIdentifier(node)
    const found = className && identifier
    if (found) {
      pairs.push([className, identifier])
    }
  }

  // continue recursive
  const hasChildren = node.children && node.children.length > 0
  if (hasChildren) {
    node.children.forEach(node => search(node, tempClassName))
  }
}

const compPath = process.argv[2]
const code = getCode(compPath)
const ast = parseAst(code)
const getReturnStatementOfRender = ast => {
  const { body } = ast.program
  const klass = body.find(({ type }) => type === 'ClassDeclaration')
  const classBody = klass.body
  const renderMethodAst = classBody.body.find(({ type, key }) => (
    type === 'ClassMethod' &&
    key.name === 'render'
  ))
  const renderMethodBody = renderMethodAst.body
  const renderReturn = renderMethodBody.body.find(({ type }) => type === 'ReturnStatement')
  return renderReturn
}

const gimmeTest = ({ className, propName }) => (`
it('should render props.${propName}', () => {
  const doc = renderDoc()
  expect(doc.find('.${className}').text()).toEqual(
    props.${propName}
  )
})
`)

const generateCode = pairs => {
  return pairs.reduce((code, [className, propName]) => (
    `${code}${gimmeTest({ className, propName })}`
  ), '')
}

const returnStatementOfRender = getReturnStatementOfRender(ast)
search(returnStatementOfRender.argument)
const test = generateCode(pairs)
console.log(test)
