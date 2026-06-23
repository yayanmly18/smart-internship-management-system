const fetch = global.fetch;

async function main() {
  // paste token here (from login request) or set env TOKEN
  const token = process.env.TOKEN || '';
  if (!token) {
    console.log('Set env TOKEN with a valid admin JWT');
    process.exit(1);
  }

  const res = await fetch('http://localhost:3001/api/auth/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  console.log('status=', res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

