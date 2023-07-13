cp dist/mjs/index.d.ts dist 

rm -rf dist/*/index.d.ts 

cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

cat >dist/mjs/package.json <<!EOF
{
    "type": "module"
}
!EOF

file_name="dist/index.d.ts"

first_line=$(head -n 1 "$file_name")
new_first_line=$(echo "$first_line" | sed 's/\.js/\.ts/')
sed -i "1s|.*|$new_first_line|" "$file_name"

original_file_path="src/types.ts"
copied_file_path="dist"
cp "$original_file_path" "$copied_file_path"