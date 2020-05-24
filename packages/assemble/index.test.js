const { assemble } = require("./index");

describe("assemble test", () => {
  const testTextOne = `
---
"assemble1": patch
"assemble2": patch
---
    
This is a test.
`;
  const testTextTwo = `
---
"assemble1": minor
"assemble2": patch
---
    
This is a test.
`;
  const testTextThree = `
---
"assemble1": patch
"assemble2": major
---
    
This is a test.
`;
  const testTextFour = `
---
"assemble1": patch
"@namespaced/assemble2": patch
---
    
This is a test.
`;

  it("runs", () => {
    const assembled = assemble([
      testTextOne,
      testTextTwo,
      testTextThree,
      testTextFour,
    ]);
    expect(assembled).toMatchSnapshot();
  });
});
