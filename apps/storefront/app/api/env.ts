import { envsafe, str } from 'envsafe';

export default envsafe({
  ISR_SECRET: str({
    input: process.env.ISR_SECRET,
  }),
});
